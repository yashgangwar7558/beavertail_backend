const AWS = require('../config/awsConfig');
const storage = require('../config/gcpStorageConfig');
const path = require('path');

const s3 = new AWS.S3();

exports.formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // return `${day}-${month}-${year}`;
    return `${year}-${month}-${day}`;
};

exports.formatMonthYear = (date) => {
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
    const conversionObject = fromUnitArray.find((unit) => unit.unit === fromUnit);
    return conversionObject ? conversionObject.conversion : 1;
};

exports.uploadToS3 = async (fileBuffer, fileName, fileType, bucketName, folderPath) => {
    try {

        if (folderPath && !folderPath.endsWith('/')) {
            folderPath += '/';
        }

        const params = {
            Bucket: bucketName,
            Key: folderPath + fileName,
            Body: fileBuffer,
            ContentType: fileType, 
            ContentDisposition: 'inline',
            ACL: 'bucket-owner-full-control'
        };

        const uploadResult = await s3.upload(params).promise();

        return uploadResult.Location;
    } catch (error) {
        console.error('Error uploading to S3:', error.message);
        throw error;
    }
};

exports.deleteFromS3 = async (objectUrl, bucketName) => {
    try {
        const objectKey = new URL(objectUrl).pathname.substr(1);
        const decodedObjectKey = decodeURIComponent(objectKey);

        const params = {
            Bucket: bucketName,
            Key: decodedObjectKey,
        };

        await s3.deleteObject(params).promise();

        console.log(`File deleted successfully: ${decodedObjectKey}`);
    } catch (error) {
        console.error('Error deleting file from S3:', error.message);
        throw error;
    }
}

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
                console.log('File uploaded successfully. Public URL:', publicUrl);
                resolve(publicUrl);
            });

            stream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error uploading to GCS:', error.message);
        throw error;
    }
};

exports.deleteFromGCS = async (objectUrl, bucketName) => {
    try {
        const url = new URL(objectUrl);
        const decodedObjectName = decodeURIComponent(url.pathname.substring(1));

        const objectNameWithoutBucket = decodedObjectName.replace(`${bucketName}/`, '');

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectNameWithoutBucket);

        await file.delete();

        console.log(`File deleted successfully: ${objectNameWithoutBucket}`);
    } catch (error) {
        console.error('Error deleting file from GCS:', error.message);
        throw error;
    }
};
