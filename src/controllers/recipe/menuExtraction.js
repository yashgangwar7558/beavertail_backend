const mongoose = require('mongoose')
const { storeExtractedCategories } = require('../../controllers/recipe/types')
const { storeExtractedRecipes } = require('../../controllers/recipe/recipeBook')
const { storeExtractedIngredients } = require('../../controllers/ingredient/ingredients')
const { storeExtractedUnitmapping } = require('../../controllers/ingredient/unitmapping')
const Recipe = require('../../models/recipe/recipeBook')
const menuExtractionStatus = require('../../models/recipe/menuExtractionStatus')
const Types = require('../../models/recipe/types')
const Ingredient = require('../../models/ingredient/ingredients')
const unitMapping = require('../../models/ingredient/unitmapping')
const { sendExtractionStatus } = require('../../utils/socket')
const { inventoryCheck, costEstimation, uploadToGCS, deleteFromGCS, getFileType, extractMenu, uploadMenuToGCS, extractCategories, extractRecipes, extractIngredients, extractUnitmapping, getFileTypeFromGCSUrl } = require('../helper')

function breakDownMenuIntoParts(menuJson, chunkSize = 4) {
    let parts = [];
    for (let i = 0; i < menuJson.length; i += chunkSize) {
        parts.push(menuJson.slice(i, i + chunkSize));
    }
    return parts;
}

function normalizeKey(value) {
    return value.trim().toLowerCase();
}

async function processMenuPart(part, tenantId, extractionRecord, uniqueCategories, uniqueRecipes, uniqueIngredients, uniqueUnitMappings, processId) {
    console.log("Extracting this menu part:");
    console.log(JSON.stringify(part, null, 2));

    console.log("Extracting categories...");
    sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting categories' });
    extractionRecord.subStatus = 'Extracting categories';
    await extractionRecord.save();
    const categoriesJson = await extractCategories(part);
    console.log(JSON.stringify(categoriesJson, null, 2));

    const categoryKeys = new Set(Array.from(uniqueCategories.values()).map(category => normalizeKey(category.subType)));
    categoriesJson.forEach(category => {
        const key = normalizeKey(category.subType);
        if (!categoryKeys.has(key)) {
            uniqueCategories.set(key, category);  
            categoryKeys.add(key); 
        }
    })
    console.log(Array.from(uniqueCategories.values()))
    
    console.log("Extracting recipes...");
    sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting recipes' });
    extractionRecord.subStatus = 'Extracting recipes';
    await extractionRecord.save();
    const recipesJson = await extractRecipes(part);
    console.log(JSON.stringify(recipesJson, null, 2));

    const recipeKeys = new Set(Array.from(uniqueRecipes.values()).map(recipe => normalizeKey(recipe.name)));
    recipesJson.forEach(recipe => {
        const key = normalizeKey(recipe.name);
        if (!recipeKeys.has(key)) {
            uniqueRecipes.set(key, recipe);
            recipeKeys.add(key);
        }
    })

    console.log("Extracting ingredients...");
    sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting ingredients' });
    extractionRecord.subStatus = 'Extracting ingredients';
    await extractionRecord.save();
    const ingredientsJson = await extractIngredients(recipesJson);
    console.log(JSON.stringify(ingredientsJson, null, 2));

    const ingredientKeys = new Set(Array.from(uniqueIngredients.values()).map(ingredient => normalizeKey(ingredient.name)));
    ingredientsJson.forEach(ingredient => {
        const key = normalizeKey(ingredient.name);
        if (!ingredientKeys.has(key)) {
            uniqueIngredients.set(key, ingredient);
            ingredientKeys.add(key);
        }
    })

    console.log("Extracting unit mapping...");
    sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting unit mappings' });
    extractionRecord.subStatus = 'Extracting unit mappings';
    await extractionRecord.save();
    const unitMappingJson = await extractUnitmapping(ingredientsJson);
    console.log(JSON.stringify(unitMappingJson, null, 2));

    const unitMappingKeys = new Set(Array.from(uniqueUnitMappings.values()).map(mapping => normalizeKey(mapping.name)));
    unitMappingJson.forEach(mapping => {
        const key = normalizeKey(mapping.name);
        if (!unitMappingKeys.has(key)) {
            uniqueUnitMappings.set(key, mapping);
            unitMappingKeys.add(key);
        }
    })
}

async function storeUniqueData(tenantId, uniqueCategories, uniqueRecipes, uniqueIngredients, uniqueUnitMappings) {
    const categoriesToStore = Array.from(uniqueCategories.values());
    const recipesToStore = Array.from(uniqueRecipes.values());
    const ingredientsToStore = Array.from(uniqueIngredients.values());
    const unitMappingsToStore = Array.from(uniqueUnitMappings.values());

    const storedCategories = await storeExtractedCategories(tenantId, categoriesToStore);
    console.log("Stored categories:", storedCategories);
    const storedIngredients = await storeExtractedIngredients(tenantId, ingredientsToStore);
    console.log("Stored ingredients:", storedIngredients);
    const storedUnitMappings = await storeExtractedUnitmapping(tenantId, unitMappingsToStore);
    console.log("Stored unit mappings:", storedUnitMappings);
    const storedRecipes = await storeExtractedRecipes(tenantId, recipesToStore);
    console.log("Stored recipes:", storedRecipes);
}

exports.menuExtraction = async (req, res) => {
    let tenantId = null
    let tenantName = null
    let processId = new mongoose.Types.ObjectId()
    try {
        const { tenantId: reqTenantId, tenantName: reqTenantName } = req.body
        tenantId = reqTenantId
        tenantName = reqTenantName

        sendExtractionStatus({ processId, status: 'started', subStatus: 'Extraction starting', startedAt: new Date() })
        let extractionRecord = new menuExtractionStatus({
            tenantId,
            tenantName,
            processId,
            status: 'started',
            subStatus: 'Extraction starting',
            startedAt: new Date(),
        });
        await extractionRecord.save()

        if (req.file) {
            const { buffer } = req.file

            const type = await getFileType(buffer);
            let fileUrl;

            console.log("File uploading to gcp...")
            const formattedTenantName = tenantName.toLowerCase().replace(/\s+/g, '_')
            if (type.mime === 'application/pdf') {
                sendExtractionStatus({ processId, status: 'started', subStatus: 'Uploading menu to GCP' })
                extractionRecord.subStatus = 'Uploading menu to GCP';
                await extractionRecord.save()
                fileUrl = await uploadMenuToGCS(buffer, `${formattedTenantName}_${Date.now()}`, type);
            } else if (['image/png', 'image/jpeg'].includes(type.mime)) {
                sendExtractionStatus({ processId, status: 'started', subStatus: 'Uploading menu to GCP' })
                extractionRecord.subStatus = 'Uploading menu to GCP';
                await extractionRecord.save()
                fileUrl = await uploadMenuToGCS(buffer, `${formattedTenantName}_${Date.now()}`, type)
            } else {
                throw new Error('Unsupported file type')
            }

            extractionRecord.status = 'in_progress';
            extractionRecord.fileUrl = fileUrl;
            extractionRecord.fileType = type.mime;
            await extractionRecord.save()

            console.log("Extracting menu...")
            sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting menu' })
            extractionRecord.subStatus = 'Extracting menu';
            await extractionRecord.save()
            const menuJson = await extractMenu(fileUrl, type.mime)
            console.log(JSON.stringify(menuJson, null, 2))

            // console.log("Extracting categories...")
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting categories' })
            // extractionRecord.subStatus = 'Extracting categories';
            // await extractionRecord.save()
            // const categoriesJson = await extractCategories(menuJson)
            // console.log(JSON.stringify(categoriesJson, null, 2))

            // console.log("Extracting recipes...")
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting recipes' })
            // extractionRecord.subStatus = 'Extracting recipes';
            // await extractionRecord.save()
            // const recipesJson = await extractRecipes(menuJson)
            // console.log(JSON.stringify(recipesJson, null, 2))

            // console.log("Extracting ingredients...")
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting ingredients' })
            // extractionRecord.subStatus = 'Extracting ingredients';
            // await extractionRecord.save()
            // const ingredientsJson = await extractIngredients(recipesJson)
            // console.log(JSON.stringify(ingredientsJson, null, 2))

            // console.log("Extracting unitmapping...")
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting unitmapping' })
            // extractionRecord.subStatus = 'Extracting unitmapping';
            // await extractionRecord.save()
            // const unitMappingJson = await extractUnitmapping(ingredientsJson)
            // console.log(JSON.stringify(unitMappingJson, null, 2))

            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Storing extracted data' })
            // extractionRecord.subStatus = 'Storing extracted data';
            // await extractionRecord.save()
            // const storedCategories = await storeExtractedCategories(tenantId, categoriesJson)
            // console.log("Stored categories:", storedCategories)
            // const storedIngredients = await storeExtractedIngredients(tenantId, ingredientsJson)
            // console.log("Stored ingredients:", storedIngredients)
            // const storedUnitmapping = await storeExtractedUnitmapping(tenantId, unitMappingJson)
            // console.log("Stored unitmapping:", storedUnitmapping)
            // const storedRecipes = await storeExtractedRecipes(tenantId, recipesJson)
            // console.log("Stored recipes:", storedRecipes)

            const menuParts = await breakDownMenuIntoParts(menuJson)

            const uniqueCategories = new Map();
            const uniqueRecipes = new Map();
            const uniqueIngredients = new Map();
            const uniqueUnitMappings = new Map();

            for (const part of menuParts) {
                await processMenuPart(part, tenantId, extractionRecord, uniqueCategories, uniqueRecipes, uniqueIngredients, uniqueUnitMappings, processId);
            }

            sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Storing extracted data' })
            extractionRecord.subStatus = 'Storing extracted data';
            await extractionRecord.save()
            await storeUniqueData(tenantId, uniqueCategories, uniqueRecipes, uniqueIngredients, uniqueUnitMappings)

            sendExtractionStatus({ processId, status: 'completed', subStatus: 'Extraction completed', completedAt: new Date() })
            extractionRecord.status = 'completed';
            extractionRecord.subStatus = 'Extraction completed';
            extractionRecord.completedAt = new Date();
            await extractionRecord.save()

            res.json({ success: true })
        } else {
            return res.json({
                success: false,
                message: 'Menu file missing!',
            });
        }
    } catch (err) {
        console.error('Error extracting menu, cleaning up extracted data:', err.message)
        try {
            await Promise.all([
                Types.deleteMany({ tenantId }).exec(),
                Ingredient.deleteMany({ tenantId }).exec(),
                unitMapping.deleteMany({ tenantId }).exec(),
                Recipe.deleteMany({ tenantId }).exec()
            ])

            sendExtractionStatus({ processId, status: 'failed', subStatus: 'Extraction failed', error: err.message })
            await menuExtractionStatus.findOneAndUpdate({ processId }, { status: 'failed', subStatus: 'Extraction failed', error: err.message })

        } catch (cleanupError) {
            console.error('Error cleaning up data and updating error:', cleanupError.message);
        }
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

exports.retryExtraction = async (req, res) => {
    let processId = null
    let tenantId = null
    let tenantName = null
    const { processId: process } = req.body;
    processId = process
    let extractionRecord = null

    try {
        // Fetch the existing extraction process
        extractionRecord = await menuExtractionStatus.findOne({ processId });
        if (!extractionRecord) {
            return res.json({ success: false, message: 'Process not found' });
        }

        // Reset statuses to retry the extraction
        sendExtractionStatus({ processId, status: 'started', subStatus: 'Retrying extraction', startedAt: new Date() })
        extractionRecord.status = 'started';
        extractionRecord.subStatus = 'Retrying extraction';
        extractionRecord.error = '';
        extractionRecord.startedAt = new Date();
        await extractionRecord.save();

        const { tenantId: reqTenantId, tenantName: reqTenantName } = req.body
        tenantId = reqTenantId
        tenantName = reqTenantName

        if (extractionRecord.fileUrl) {
            const fileUrl = extractionRecord.fileUrl;
            const type = extractionRecord.fileType;

            extractionRecord.status = 'in_progress';
            extractionRecord.subStatus = 'Extracting menu';
            await extractionRecord.save();

            console.log("Extracting menu...");
            sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting menu' });
            extractionRecord.subStatus = 'Extracting menu';
            await extractionRecord.save();
            const menuJson = await extractMenu(fileUrl, type);
            console.log(JSON.stringify(menuJson, null, 2));

            // console.log("Extracting categories...");
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting categories' });
            // extractionRecord.subStatus = 'Extracting categories';
            // await extractionRecord.save();
            // const categoriesJson = await extractCategories(menuJson);
            // console.log(JSON.stringify(categoriesJson, null, 2));

            // console.log("Extracting recipes...");
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting recipes' });
            // extractionRecord.subStatus = 'Extracting recipes';
            // await extractionRecord.save();
            // const recipesJson = await extractRecipes(menuJson);
            // console.log(JSON.stringify(recipesJson, null, 2));

            // console.log("Extracting ingredients...");
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting ingredients' });
            // extractionRecord.subStatus = 'Extracting ingredients';
            // await extractionRecord.save();
            // const ingredientsJson = await extractIngredients(recipesJson);
            // console.log(JSON.stringify(ingredientsJson, null, 2));

            // console.log("Extracting unitmapping...");
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Extracting unitmapping' });
            // extractionRecord.subStatus = 'Extracting unitmapping';
            // await extractionRecord.save();
            // const unitMappingJson = await extractUnitmapping(ingredientsJson);
            // console.log(JSON.stringify(unitMappingJson, null, 2));

            // // Store extracted data in the database
            // sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Storing extracted data' });
            // extractionRecord.subStatus = 'Storing extracted data';
            // await extractionRecord.save();
            // const storedCategories = await storeExtractedCategories(tenantId, categoriesJson);
            // console.log("Stored categories:", storedCategories);
            // const storedIngredients = await storeExtractedIngredients(tenantId, ingredientsJson);
            // console.log("Stored ingredients:", storedIngredients);
            // const storedUnitmapping = await storeExtractedUnitmapping(tenantId, unitMappingJson);
            // console.log("Stored unitmapping:", storedUnitmapping);
            // const storedRecipes = await storeExtractedRecipes(tenantId, recipesJson);
            // console.log("Stored recipes:", storedRecipes);

            const menuParts = await breakDownMenuIntoParts(menuJson)

            const uniqueCategories = new Map();
            const uniqueRecipes = new Map();
            const uniqueIngredients = new Map();
            const uniqueUnitMappings = new Map();

            for (const part of menuParts) {
                await processMenuPart(part, tenantId, extractionRecord, uniqueCategories, uniqueRecipes, uniqueIngredients, uniqueUnitMappings, processId);
            }

            sendExtractionStatus({ processId, status: 'in_progress', subStatus: 'Storing extracted data' })
            extractionRecord.subStatus = 'Storing extracted data';
            await extractionRecord.save()
            await storeUniqueData(tenantId, uniqueCategories, uniqueRecipes, uniqueIngredients, uniqueUnitMappings)

            // Mark extraction as completed
            sendExtractionStatus({ processId, status: 'completed', subStatus: 'Extraction completed', completedAt: new Date()});
            extractionRecord.status = 'completed';
            extractionRecord.subStatus = 'Extraction completed';
            extractionRecord.completedAt = new Date();
            await extractionRecord.save();

            res.json({ success: true, message: 'Extraction retried and completed successfully.' });

        } else {
            throw new Error('File URL missing, cannot retry extraction without file.');
        }
    } catch (err) {
        console.error('Error during retry extraction:', err.message);
        try {
            // Clean up any data if extraction fails
            await Promise.all([
                Types.deleteMany({ tenantId }).exec(),
                Ingredient.deleteMany({ tenantId }).exec(),
                unitMapping.deleteMany({ tenantId }).exec(),
                Recipe.deleteMany({ tenantId }).exec()
            ]);

            // Update process status to failed
            sendExtractionStatus({ processId, status: 'failed', subStatus: 'Extraction failed', error: err.message });
            await menuExtractionStatus.findOneAndUpdate({ processId }, { status: 'failed', subStatus: 'Extraction failed', error: err.message });

        } catch (cleanupError) {
            console.error('Error cleaning up data and updating error:', cleanupError.message);
        }

        res.status(500).json({ success: false, message: 'Failed to retry extraction.' });
    }
}

exports.deleteExtraction = async (req, res) => {
    try {
        const { processId, tenantId } = req.body

        sendExtractionStatus({ processId, status: 'reverting', subStatus: 'Deleting extracted data' })
        await menuExtractionStatus.findOneAndUpdate({ processId }, { status: 'reverting', subStatus: 'Deleting extracted data' });

        await Promise.all([
            Types.deleteMany({ tenantId }).exec(),
            Ingredient.deleteMany({ tenantId }).exec(),
            unitMapping.deleteMany({ tenantId }).exec(),
            Recipe.deleteMany({ tenantId }).exec()
        ]);

        sendExtractionStatus({ processId, status: 'reverted', subStatus: 'Deleted extracted data' });
        await menuExtractionStatus.findOneAndUpdate({ processId }, { status: 'reverted', subStatus: 'Deleted extracted data' })

        res.json({ success: true, message: 'Revertion of extracted process completed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to revert extraction.' });
    }
}



