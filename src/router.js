/**
 * Created by qqwan on 2018/6/4.
 */
var bodyParser = require('body-parser');
const express = require('express');
var apiRouter = express.Router();
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
apiRouter.post('/send_command', function (req,res) {
    var data = req.body;
    console.log(data)
    res.send({retCode: '1'})
})
app.use('/api', apiRouter);
exports.getRouter = function () {
    return app
}