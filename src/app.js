const express = require('express');
require('dotenv').config();
const { socketConnection } = require('./utils/socket')
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectToMongoDB } = require('./db/conn')
const tenantRouter = require('./routers/tenant/tenant');
const posRefRouter = require('./routers/tenant/posRef');
const userRouter = require('./routers/user/user');
const roleRouter = require('./routers/user/role');
const featureRouter = require('./routers/user/feature');
const extractMenuRouter = require('./routers/recipe/menuExtraction');
const typesRouter = require('./routers/recipe/types');
const recipesRouter = require('./routers/recipe/recipeBook');
const ingredientsRouter = require('./routers/ingredient/ingredients');
const unitMapsRouter = require('./routers/ingredient/unitmapping');
const invoiceRouter = require('./routers/invoice/invoice');
const processInvoiceRouter = require('./routers/invoice/processInvoice');
const purchaseHistoryRouter = require('./routers/invoice/purchaseHistory');
const processBillRouter = require('./routers/sales/processBill');
const salesRouter = require('./routers/sales/sales');
const salesHistoryRouter = require('./routers/sales/salesHistory');
const alertsRouter = require('./routers/alert/alert');
const menuExtractionStatusRouter = require('./routers/recipe/menuExtractionStatus');
// const recipeCostHistoryRouter = require('./routers/recipe/recipeCostHistory');
// const modifierCostHistoryRouter = require('./routers/recipe/modifierCostHistory');
// const ingredientCostHistoryRouter = require('./routers/ingredient/ingredientCostHistory');

const app = express();
const port = process.env.PORT;

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(bodyParser.json());

app.use(cors());

connectToMongoDB()
    .then(() => {
        app.use(userRouter)
        app.use(tenantRouter)
        app.use(posRefRouter)
        app.use(roleRouter)
        app.use(featureRouter)
        app.use(extractMenuRouter)
        app.use(typesRouter)
        app.use(recipesRouter)
        app.use(ingredientsRouter)
        app.use(unitMapsRouter)
        app.use(processInvoiceRouter)
        app.use(purchaseHistoryRouter)
        app.use(invoiceRouter)
        app.use(processBillRouter)
        app.use(salesRouter)
        app.use(salesHistoryRouter)
        app.use(alertsRouter);
        app.use(menuExtractionStatusRouter);
        // app.use(recipeCostHistoryRouter)
        // app.use(ingredientCostHistoryRouter)
        // app.use(modifierCostHistoryRouter)

        app.get('/', async (req, res) => {
            res.status(200).send("Welcome to Beavertail. Server is live!")
        })

        const server = app.listen(port, () => {
            console.log(`Server is live at port no. ${port}`);
        });

        socketConnection(server)
    })
    .catch((err) => {
        console.error("Server not live!")
        console.error("Failed to connect to database:", err.message)
        process.exit(1);
    });
