const AWS = require('../config/awsConfig');
const { storage, vertexAI } = require('../config/gcpConfig')
const openai = require('../config/openAIConfig');
const path = require('path');
const { recipeWiseSalesDataBetweenDates, typeWiseSalesDataBetweenDates } = require('./sales/salesHistory')
const Ingredient = require('../models/ingredient/ingredients');

const { PDFDocument } = require('pdf-lib')
const { createCanvas } = require('canvas')
const Jimp = require('jimp')
const { fromBuffer } = require('pdf2pic');
const { fileURLToPath } = require('url');

const s3 = new AWS.S3();

exports.formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // return `${day}-${month}-${year}`;
    return `${month}/${day}/${year}`;
};

exports.formatMonthYear = async (date) => {
    const options = { month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    const [month, year] = formattedDate.split(' ');
    const lastTwoDigitsOfYear = year.slice(-2);

    const formattedResult = `${month}-${lastTwoDigitsOfYear}`;

    return formattedResult;
}

exports.inventoryCheck = async (ingredients, AllIngredients, UnitMaps) => {
    const allIngredientsPresent = await Promise.all(ingredients.map(async (ingredient) => {

        const matchingIngredient = AllIngredients.find(
            (allIngredient) => allIngredient._id.toString() === ingredient.ingredient_id.toString()
        );

        if (!matchingIngredient) {
            return false;
        }

        const unitMap = UnitMaps.find(
            (unitMap) => unitMap.ingredient_id.toString() === ingredient.ingredient_id.toString()
        );

        const toUnit = unitMap ? unitMap.toUnit : ingredient.unit;
        const convertedQuantity = ingredient.quantity * exports.getConversionFactor(ingredient.unit, toUnit, unitMap.fromUnit);
        const convertedInventory = matchingIngredient.inventory * exports.getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit);

        if (convertedQuantity > convertedInventory) {
            return false;
        }
        return true;
    }));
    return allIngredientsPresent.every((present) => present);
}

exports.costEstimation = async (ingredients, AllIngredients, UnitMaps) => {
    let totalCost = 0;

    for (const ingredient of ingredients) {

        const matchingIngredient = AllIngredients.find(
            (allIngredient) => allIngredient._id.toString() === ingredient.ingredient_id.toString()
        );

        if (matchingIngredient) {
            const unitMap = UnitMaps.find(
                (unitMap) => unitMap.ingredient_id.toString() === ingredient.ingredient_id.toString()
            );
            const toUnit = unitMap ? unitMap.toUnit : ingredient.unit;
            const convertedQuantity = ingredient.quantity * exports.getConversionFactor(ingredient.unit, toUnit, unitMap.fromUnit);
            const costPerUnit = matchingIngredient.avgCost / exports.getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit) || 0;
            totalCost += costPerUnit * convertedQuantity;
        }
    }

    return totalCost;
}

exports.getConversionFactor = (fromUnit, toUnit, fromUnitArray) => {
    try {
        const conversionObject = fromUnitArray.find((unit) => unit.unit === fromUnit);
        return conversionObject ? conversionObject.conversion : 1;
    } catch (error) {
        console.error('Error getting conversion factor of ingredient:', error.message);
        throw error;
    }
};


exports.uploadToGCS = async (fileBuffer, fileName, fileType, bucketName, folderPath) => {
    try {
        if (folderPath && !folderPath.endsWith('/')) {
            folderPath += '/';
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(folderPath + fileName);

        const stream = file.createWriteStream({
            metadata: {
                contentType: fileType,
            },
            predefinedAcl: 'publicRead',
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (error) => {
                console.error('Error uploading to GCS:', error.message);
                reject(error);
            });

            stream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucketName}/${folderPath}${fileName}`;
                resolve(publicUrl);
            });

            stream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error uploading to GCS:', error.message);
        throw error;
    }
}

exports.deleteFromGCS = async (objectUrl, bucketName) => {
    try {
        const url = new URL(objectUrl);
        const decodedObjectName = decodeURIComponent(url.pathname.substring(1));

        const objectNameWithoutBucket = decodedObjectName.replace(`${bucketName}/`, '');

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectNameWithoutBucket);

        await file.delete();
    } catch (error) {
        console.error('Error deleting file from GCS:', error.message);
        // throw error;
    }
}

exports.getFileType = async (buffer) => {
    const { fileTypeFromBuffer } = await import('file-type');
    return await fileTypeFromBuffer(buffer);
}

exports.getFileTypeFromGCSUrl = async (fileUrl) => {
    try {
      // Parse bucket name and file path from GCS URL
      const matches = fileUrl.match(/^gs:\/\/([^/]+)\/(.+)$/);
      if (!matches) {
        throw new Error('Invalid GCS URL format');
      }
  
      const bucketName = matches[1];
      const filePath = matches[2];
  
      // Get a reference to the file in the bucket
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
  
      // Download the file as a buffer
      const [fileBuffer] = await file.download();
  
      // Detect the file type using the file-type library
      const type = await FileType.fromBuffer(fileBuffer);
      if (type) {
        console.log(`Detected file type: ${type.mime}`);
        return type.mime;
      } else {
        // Fall back to the file extension if the MIME type is not detectable
        const extension = path.extname(filePath).slice(1);
        return `application/${extension}`;
      }
    } catch (error) {
      console.error('Error detecting file type:', error.message);
      throw error;
    }
  }

const convertPdfToImage = async (buffer) => {
    const options = {
        density: 100,
        format: "png",
        width: 600,
        height: 600
    }
    const convert = fromBuffer(buffer, options)

    const imageResult = await convert(1, { responseType: "buffer" })
    console.log(imageResult.buffer);

    return imageResult.buffer
}

const uploadInvoiceToGCS = async (buffer, fileName, fileType) => {
    try {
        const bucketName = process.env.BUCKET_NAME
        const bucket = storage.bucket(bucketName);
        const extension = fileType === 'application/pdf' ? 'pdf' : 'png';
        const file = bucket.file(`extract/${fileName}.${extension}`);

        await file.save(buffer, {
            metadata: { contentType: fileType },
            public: true
        })

        return `gs://${bucketName}/extract/${fileName}.${extension}`
        // return `https://storage.googleapis.com/${bucketName}/extract/${fileName}.${extension}`
    } catch (error) {
        console.error('Error uploading invoice to GCS:', error.message);
        throw error;
    }
}

exports.uploadMenuToGCS = async (buffer, fileName, fileType) => {
    try {
        const bucketName = process.env.BUCKET_NAME
        const bucket = storage.bucket(bucketName);
        const extension = fileType === 'application/pdf' ? 'pdf' : 'png';
        const file = bucket.file(`menu/${fileName}.${extension}`);

        await file.save(buffer, {
            metadata: { contentType: fileType },
            public: true
        })

        return `gs://${bucketName}/menu/${fileName}.${extension}`
        // return `https://storage.googleapis.com/${bucketName}/menu/${fileName}.${extension}`
    } catch (error) {
        console.error('Error uploading menu to GCS:', error.message);
        throw error;
    }
}

const extractTextFromPdf = async (buffer) => {
    const { createWorker } = require('tesseract.js')
    const worker = await createWorker("eng");
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    return data.text;
}

exports.modelprompt1 = `
Extract the following details from the invoice and return in JSON format without any additional text:

Invoice Number: Extract from fields like "Invoice number", "Reference Number", or "REF#". Return as invoiceNumber.

Vendor Name: Extract the company name that produced the invoice. Return as vendor.

Invoice Date: Extract from fields like "Invoice Date" or "Billing Date". Format as 'MM-DD-YYYY'. Return as invoiceDate.

Total: Extract the sum of item totals without any taxes, discounts, or additional charges. Return as total.

Additions: Sum of all types of taxes or previous balances left. Return as additions.

Deductions: Sum of all discounts or amounts already paid by the customer or retainer. Return as deductions.

Total Payable: Extract the total payable amount after applying all taxes, discounts, previous balances, or already paid amounts. Return as totalPayable.

Ingredients: Extract the list of items with the following details:

Name: Extract from fields like "Description" or "Item". Return as name.
Quantity: Extract from fields like "Qty" or "Quantity". If not readable or mentioned, default to 1. Return as quantity.
Unit Price: Extract the unit price per quantity. If not mentioned, calculate as item total / quantity. Return as unitPrice.
Total: Extract the total amount for the particular item. If quantity is 1, it will be the same as the unit price. Return as total.

Important: Do not include any numerical values with commas, brackets, or dollar signs. E.g., $3,240.97 should be returned as 3240.97.

Output JSON Format:

{
  "invoiceNumber": "",
  "vendor": "",
  "invoiceDate": "MM-DD-YYYY",
  "ingredients": [
    {
      "name": "",
      "quantity": "",
      "unitPrice": "",
      "total": ""
    }
  ],
  "total": "",
  "additions": "",
  "deductions": "",
  "totalPayable": ""
}
`

exports.extractInvoiceOpenAI = async (buffer) => {
    try {
        const type = await exports.getFileType(buffer);
        let imageBuffer;
        let extractedData;
        const fileName = `invoice_${Date.now()}`;

        if (type.mime === 'application/pdf') {
            const text = await extractTextFromPdf(buffer)
            console.log(text)
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Extract the following information from the provided text:\n\n${text}\n\n Return Invoice number as invoiceNumber, Vendor Name the company that produced invoice as vendor, Invoice Date as invoiceDate, Total Amount as total and list of items named ingredients as array of objects with fields description as name, Qty as quantity, Unit Price as unitPrice, Amount as total. Also return just JSON format with no additional texts` },
                        ],
                    },
                ],
                max_tokens: 1200,
            });

            extractedData = response.choices[0].message.content;
        } else if (['image/png', 'image/jpeg'].includes(type.mime)) {
            imageBuffer = buffer;
            const imageURL = await uploadInvoiceToGCS(imageBuffer, fileName);
            console.log(imageURL);
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text", text: exports.modelprompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageURL,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1200,
            });
            extractedData = response.choices[0].message.content
        } else {
            throw new Error('Unsupported file type');
        }

        const startIndex = extractedData.indexOf('{')
        const endIndex = extractedData.lastIndexOf('}') + 1
        const jsonStr = extractedData.slice(startIndex, endIndex)

        return JSON.parse(jsonStr)
    } catch (error) {
        console.error('Error extracting invoice data through openAI:', error.message);
        throw error;
    }
}

exports.extractInvoiceVertexAI = async (buffer) => {
    try {
        const type = await exports.getFileType(buffer);
        let fileUrl;

        if (type.mime === 'application/pdf') {
            fileUrl = await uploadInvoiceToGCS(buffer, `invoice_${Date.now()}`, type.mime);
        } else if (['image/png', 'image/jpeg'].includes(type.mime)) {
            fileUrl = await uploadInvoiceToGCS(buffer, `invoice_${Date.now()}`, type.mime)
        } else {
            throw new Error('Unsupported file type')
        }

        console.log(fileUrl)

        const filePart = {
            file_data: {
                file_uri: fileUrl,
                mime_type: type.mime,
            },
        }

        const textPart = {
            text: exports.modelprompt1,
        }

        const request = {
            contents: [{ role: 'user', parts: [filePart, textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonStringMatch1 = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)

        let jsonString = null;

        if (jsonStringMatch1) {
            jsonString = jsonStringMatch1[1].trim();
        } else {
            jsonString = extractedData.parts[0].text
        }

        const jsonResponse = JSON.parse(jsonString)

        await exports.deleteFromGCS(fileUrl, bucketName = process.env.BUCKET_NAME)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting invoice data through vertexAI:', error.message);
        throw error;
    }
}

exports.promptExtractMenu = `Read this restaurant menu and return items with there price, category and description in json format.`
exports.promptExtractCategories = `From this extract the categories in following json format: \n 
type: Should be either Food or Beverage, so according to actual category figure it out if it comes under Food or Beverage, \n
subType: Actual category, \n

Even if its single category return as array of objects`
exports.promptExtractRecipes = `From this extract the items and their ingredients req to build the recipe in following json format. \n 
name: the item name \n
category: Food or Beverage depending on the main category of item \n
subCategory: the main category to which item belongs \n
methodPrep: method of preparation of this recipe in short \n
menuPrice: menu price of item in dollar \n
ingredients: [{ \n
  name: ingredient name required to create recipe, \n
  category: type of ingredient like vegetable, fruit, spices or poultry etc \n
  quantity: just the quantity of ingredient req,  like eg. 1/2 cup so quantity should be just 0.5, always provide some quantity don't make it to taste, also provide sensible quantity like if its sauce then use unit tp, tsp or ml, not directly l(litre) \n
  unit: unit of quantity, like if quantity is 1/2 cup then unit is cup, eg cup, tsp, tp, g, kg, lbs, oz, l, ml etc. Use sensible units such that quantity is not very less. \n
}] \n

Note: I want all the ingredients required for a recipe to make, even the smallest ingredients. All should have a quantity and some unit to it.
Even if its single recipe return as array of objects, even if its a beverage always return recipe dont return anything except json
Return me the response as json only, Dont want any code or logic to do that. Do it for me itself `
exports.promptExtractIngredients = `Give me all the list of all unique ingredients from these recipes in json format: \n

name: name of ingredient, keep ingrdient name exactly same as in recipes \n
category: category of ingredient \n
invUnit: unit of that ingredient, not necessary to use provided unit. Use the unit that makes sense to store it as inventory. Like spices might be used in recipes in tp or tsp but in inventory stored as lbs or oz. Use units out of g, kg, lbs, oz, l, ml, package, packet batch, can etc
Even if its single ingredient return as array of objects
Return me the response as json only, Dont want any code or logic. Do it for me itself `
exports.promptExtractUnitmapping = `I want to create unitmapping for these items like this eg and return as array of this json objects: \n
{
  "name": "Salt",
  "fromUnit": [
    {
      "unit": "ts",
      "conversion": 1,
    },
    {
      "unit": "g",
      "conversion": 1,
    },
    {
      "unit": "kg",
      "conversion": 1000,
    }
  ],
  "toUnit": "g",
  "description": "standard unit is gram",
} \n

Take toUnit as the invUnit of ingredient. In fromUnit take all possible unit suitable for a Ingredient like tp, tsp, cup, piece, g, kg, lbs, oz, l, ml, package, packet, batch, can etc.
Return me the response as json only, Dont want any code or logic. Do it for me itself \n
`

exports.extractMenu = async (fileUrl, mime) => {
    try {
        console.log(fileUrl)

        const filePart = {
            file_data: {
                file_uri: fileUrl,
                mime_type: mime,
            },
        }

        const textPart = {
            text: exports.promptExtractMenu,
        }

        const request = {
            contents: [{ role: 'user', parts: [filePart, textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonStringMatch1 = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)

        let jsonString = null;

        if (jsonStringMatch1) {
            jsonString = jsonStringMatch1[1].trim();
        } else {
            jsonString = extractedData.parts[0].text
        }

        const jsonResponse = JSON.parse(jsonString)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting menu data through vertexAI:', error.message);
        throw error;
    }
}

exports.extractCategories = async (menuJson) => {
    try {
        const menuString = JSON.stringify(menuJson)
        const textPart = {
            text: `${menuString}\n\n${exports.promptExtractCategories}`,
        }

        const request = {
            contents: [{ role: 'user', parts: [textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonStringMatch1 = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)

        let jsonString = null;

        if (jsonStringMatch1) {
            jsonString = jsonStringMatch1[1].trim();
        } else {
            jsonString = extractedData.parts[0].text
        }

        const jsonResponse = JSON.parse(jsonString)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting categories through vertexAI:', error.message);
        throw error;
    }
}

exports.extractRecipes = async (menuJson) => {
    try {
        const menuString = JSON.stringify(menuJson)
        const textPart = {
            text: `${menuString}\n\n${exports.promptExtractRecipes}`,
        }

        const request = {
            contents: [{ role: 'user', parts: [textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonStringMatch1 = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)

        let jsonString = null;

        if (jsonStringMatch1) {
            jsonString = jsonStringMatch1[1].trim();
        } else {
            jsonString = extractedData.parts[0].text
        }

        const jsonResponse = JSON.parse(jsonString)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting recipes through vertexAI:', error.message);
        throw error;
    }
}

exports.extractIngredients = async (recipesJson) => {
    try {
        const recipesString = JSON.stringify(recipesJson)
        const textPart = {
            text: `${recipesString}\n\n${exports.promptExtractIngredients}`,
        }

        const request = {
            contents: [{ role: 'user', parts: [textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonStringMatch1 = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)

        let jsonString = null;

        if (jsonStringMatch1) {
            jsonString = jsonStringMatch1[1].trim();
        } else {
            jsonString = extractedData.parts[0].text
        }

        const jsonResponse = JSON.parse(jsonString)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting ingredients through vertexAI:', error.message);
        throw error;
    }
}

exports.extractUnitmapping = async (ingredientsJson) => {
    try {
        const ingredientsString = JSON.stringify(ingredientsJson)
        const textPart = {
            text: `${ingredientsString}\n\n${exports.promptExtractUnitmapping}`,
        }

        const request = {
            contents: [{ role: 'user', parts: [textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonStringMatch1 = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)

        console.log(extractedData.parts[0].text);
        

        let jsonString = null;

        if (jsonStringMatch1) {
            jsonString = jsonStringMatch1[1].trim();
        } else {
            jsonString = extractedData.parts[0].text
        }

        const jsonResponse = JSON.parse(jsonString)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting unitMapping through vertexAI:', error.message);
        throw error;
    }
}