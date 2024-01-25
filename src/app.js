const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const connectToMongoDB = require('./db/conn')
const userRouter = require('./routers/user');
const recipesRouter = require('./routers/recipeBook');
const ingredientsRouter = require('./routers/ingredients');
const unitMapsRouter = require('./routers/unitmapping');
const processInvoiceRouter = require('./routers/processInvoice');
const purchaseHistoryRouter = require('./routers/purchaseHistory');
const invoiceRouter = require('./routers/invoice');
const processBillRouter = require('./routers/processBill');
const salesRouter = require('./routers/sales');
const salesHistoryRouter = require('./routers/salesHistory');
// const recipeCostHistoryRouter = require('./routers/recipeCostHistory');
// const ingredientCostHistoryRouter = require('./routers/ingredientCostHistory');
// const modifierCostHistoryRouter = require('./routers/modifierCostHistory');

const app = express();
const port = process.env.PORT;

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(bodyParser.json());

app.use(cors());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

connectToMongoDB()
    .then(() => {

        app.use(userRouter)
        app.use(recipesRouter)
        app.use(ingredientsRouter)
        app.use(unitMapsRouter)
        app.use(processInvoiceRouter)
        app.use(purchaseHistoryRouter)
        app.use(invoiceRouter)
        app.use(processBillRouter)
        app.use(salesRouter)
        app.use(salesHistoryRouter)
        // app.use(recipeCostHistoryRouter)
        // app.use(ingredientCostHistoryRouter)
        // app.use(modifierCostHistoryRouter)

        app.get('/', async (req, res) => {
            res.status(200).send("Server is live!")
        })

        app.listen(port, () => {
            console.log(`Server is live at port no. ${port}`);
        })
    })