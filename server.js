const express = require('express')
const app = express()
const cors = require('cors')
const { application, urlencoded } = require('express')
const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

console.log("URI: " + process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true});

const dayArr = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const userSchema = new Schema({
  username: String
}, {versionKey: false});

const exerciseSchema = new Schema({
  user: Schema.ObjectId,
  description: String,
  duration: Number,
  date: Date,
}, {versionKey: false});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

var createUserHandler = function(req,res) {
  let newUser = new User({username: req.body.username});
  newUser.save(function(err,data){
    if(err) { console.log(err); return; }
    res.json({username:data.username, _id:data._id});
  })
}

var getUserHandler = function(req,res) {
  User.find({}, function(err, data){
    if(err) { console.log(err); return; }
    res.json(data);
  });
}

var createExerciseHandler = function(req,res) {
  User.findById(req.params.id, function(err,user){
    if(err) { res.send(err.message); return; }
    
    var reqDate;
    if(req.body.date === undefined || req.body.date === "")
      reqDate = new Date();
    else
      reqDate = new Date(req.body.date);

    var formatDate = reqDate.toDateString();
    
    let newExercise = new Exercise({
      user:user,
      description:req.body.description,
      duration:req.body.duration,
      date:formatDate
    });
    newExercise.save(function(err,exercise){
      if(err) { res.json(err.message); return; }
      res.json({
        _id:user._id, 
        username:user.username,
        date:new Date(exercise.date).toDateString(),
        duration:exercise.duration,
        description:exercise.description
      });
    });
  })
}

var getLogHandler = function(req,res) {
  console.log(req.url);

  User.findById(req.params.id, function(err,user_res){
    if(err) { res.send(err.message); return; }
    var from = new Date(req.query.from);
    var to = new Date(req.query.to);
    var lim = parseInt(req.query.limit);
    var query = {user:user_res};
    var dateQuery = {$gte:"", $lt:""};

    const reg = /[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/i;
    if(reg.test(req.query.from))
      dateQuery.$gte = from;
    if(reg.test(req.query.to))
      dateQuery.$lt = to;
    if(dateQuery.$gte !== "" && dateQuery.$lt !== "")
      query.date = dateQuery;

    Exercise.find(query,{_id:0, user:0}).limit(lim).exec(function(err, exercise){
      if(err) { res.json(err.message); return; }
      exerciseRes = [];
      exercise.forEach(function(exc){
        var excFormat = {
          description:exc.description,
          duration:exc.duration,
          date:new Date(exc.date).toDateString()
        }
        exerciseRes.push(excFormat);
      });
      res.json({
        _id: user_res._id,
        username: user_res.username,
        count: exercise.length,
        log: exerciseRes
      });
    });
  });
}


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', urlencoded({extended:true}), createUserHandler);
app.get('/api/users', getUserHandler);

app.post('/api/users/:id/exercises',  urlencoded({extended:true}), createExerciseHandler);
app.get('/api/users/:id/logs', getLogHandler);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
