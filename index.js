//VARIABLES
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let http = require('http').Server(app);
const fs = require('fs');

const MongoClient = require('mongodb').MongoClient;
const mongo_username = process.env.MONGO_USERNAME
const mongo_password = process.env.MONGO_PASSWORD

const uri = `mongodb+srv://${mongo_username}:${mongo_password}@crm-app.38y5m.mongodb.net/numleaddb?retryWrites=true&w=majority`;

//APP.USE/ENGINE/SET
app.use('/css',express.static(__dirname +'/css'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('pug', require('pug').__express)
app.set('views', '.')
app.set('view engine', 'pug')

//Redirect to index.html
app.get('/', function (req, res) {
  res.sendFile('/index.html', {root:'.'});
});

//Create/Insert element into database
app.post('/create', function (req, res, next) {
  MongoClient.connect(uri, function(err, client) {
    const dataBase = client.db("numleaddb");
    let data = {name: req.body.username, number: parseInt(req.body.number)};

    //Insert documents
    insertDocuments(dataBase, data, () => {
      console.log('Insert successful');
    });

    //Create the leaderboard page
    dataFunction(req, res);
  })
});

//Insert into database function
const insertDocuments = (db, data, callback) => {
  const collection = db.collection('leader');

  collection.insert([data], (error, result) => {
    if (error) return process.exit(1);
    callback(result);
  });
};

//Get all data function
function dataFunction(req, res) {
  MongoClient.connect(uri, async function(err, client) {
    if (err) throw err;
    const db = client.db("numleaddb");

    var html = '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Leaderboard</title><link href="css/style.css" rel="stylesheet" type="text/css" /><link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=Staatliches&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;500&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Oswald&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap" rel="stylesheet"><script src="https://kit.fontawesome.com/6981eea73f.js" crossorigin="anonymous"></script></head><body><a href="/" class="arrow"><i class="fas fa-arrow-left"></i></a><h1>Number Leaderboard</h1><div id="values">';

    //Iterate through documents
    await db.collection("leader").find().sort({number: -1}).forEach(function(doc) {
      html += '<div class="card">' + doc.number + ' - ' + doc.name + '</div>';
    });
      
    //Finalize html
    html += '</div></body>';

    //Write
    fs.writeFileSync('leaderboard.html', html);

    //Send to file and write
    res.sendFile('leaderboard.html', {root:'.'});
  })
}

//Set up the program
app.set('port', process.env.PORT || 5000);
http.listen(app.get('port'), function() {
    console.log('listening on port', app.get('port'));
});