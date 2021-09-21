/*Package Declarations*/
var express       		  = require("express"),
	app					  = express(),
	//http    			  = require("http").createServer(app),
	//io					  = require("socket.io")(http),
	ejs		      		  = require("ejs"), 
	mongoose      		  = require("mongoose"),
	passport      		  = require("passport"), 
    bodyParser            = require("body-parser"), 
    LocalStrategy         = require("passport-local"), 
    passportLocalMongoose = require("passport-local-mongoose"),
	axios 				  = require('axios'),
	user				  = require("./models/User"),
	idea				  = require("./models/Idea"),
	connect				  = require("./models/connection")
	fs 					  = require('fs'),
	multer				  = require('multer'),
	methodOverride        = require("method-override"),
	path 				  = require('path'); 
							require('dotenv/config')									
/*Package initialization*/


app.set("view engine", "ejs");
app.use('/static',express.static('public'));
app.use(bodyParser.urlencoded({ extended: 'true' }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

mongoose.connect('mongodb://localhost:27017/ideas',{
	useNewUrlParser: true,
	UseUnifiedTopology: true
})
.then(() => console.log('Connected to DB!'))
.catch( error => console.log(error.message));

/*Passport Config*/

app.use(require("express-session")({
	secret: "All ideas are important",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    user.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use((req, res, next)=>{
	res.locals.currentUser= req.user;
	next();
});

var storage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'uploads') 
    }, 
    filename: (req, file, cb) => { 
        cb(null, file.fieldname + '-' + Date.now()) 
    } 
}); 
  var upload = multer({ storage: storage }); 
//=======================
//--------ROUTES---------
//=======================

app.get("/", function(req, res){
	res.render("landing");
});

app.get("/login", function(req, res){
	res.render("login");
});

app.post("/log",passport.authenticate("local",{
	successRedirect: "/ideas",
	failureRedirect: "/login"
}), function(req, res){
});

app.get("/logout", (req, res)=>{
	req.logout();
	res.redirect("/");
});

app.get("/signup", function(req, res){
	res.render("signup");
});

app.post("/signup", (req, res)=>{
	var newUser= new user({username: req.body.username, email: req.body.youremail, city: req.body.City});
	user.register(newUser, req.body.password, function(err, User){
		if(err){
			console.log(err);
			return res.render("login")
		}
		passport.authenticate("local")(req, res, function(){
		res.redirect("/ideas");	
		})
	});
});


app.get("/ideas", isLoggedIn, function(req, res){
	idea.find({}, (err, items) => { 
        if (err) { 
            console.log(err); 
        } 
        else { 
            res.render('home', { items: items }); 
        } 
    }); 
});

app.get("/ideas/new", isLoggedIn, function(req, res){
	res.render("postIdeas");
});

app.post('/ideas', upload.single('image'), (req, res, next) => { 
		var desc= req.body.desc;
		desc= desc.replace(/\r?\n/g, '<br>');
		desc= desc.replace(/\n+/g, '<br>');
		var file= req.file;
		if (file !== undefined) {
			var obj = { 
						title: req.body.name, 
						details: desc, 
						creator: {userId : req.user._id,
						  		  username: req.user.username},
						img: { 
								data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
								contentType: 'image/png'} 	
			}}
		else{
			var obj = { 
						title: req.body.name, 
						details: desc, 
						creator: {userId : req.user._id,
						  		  username: req.user.username},
						img: { 
								contentType: null} 				
			}	
		}
		idea.create(obj, (err, item) => { 
		if (err) { 
		console.log(err); 
		} 
		else { 
		res.redirect('/ideas'); 
		} 
		}); 
}); 

app.get("/ideas/:id", isLoggedIn, (req, res)=>{
	idea.findById(req.params.id, (err, foundBlog)=>{
		if(err){
			res.redirect("/ideas");
		}
		else{
			res.render("show", {idea: foundBlog});
		}
	})
});

app.get("/ideas/:id/edit", isLoggedIn, (req, res)=>{
	idea.findById(req.params.id, (err, foundBlog)=>{
		if(err){
			res.redirect("/ideas");
		}
		else{
			res.render("edit", {idea: foundBlog});
		}
	});
});

app.put("/ideas/:id", (req, res)=>{
	var desc= req.body.details;
	desc= desc.replace(/\r?\n/g, '<br>');
	desc= desc.replace(/\n+/g, '<br>');
	idea.findByIdAndUpdate(req.params.id, {$set: {
		title: req.body.title,
		details: desc,
	}}, (err, updatedBlog)=>{
		if(err){
			res.redirect("/ideas");}
		else{
			res.redirect("/ideas/"+req.params.id);
		}
	});
});

app.post('/posts/:id/act', (req, res, next) => {
    const action = req.body.action; var likes;
    const counter = action === 'Like' ? 1 : -1;
    idea.findByIdAndUpdate(req.params.id, {$inc: {likes_count: counter}}, {}, (err, numberAffected) => {
    res.send('');
  });
});

app.delete("/ideas/:id", (req, res)=>{
	idea.findByIdAndRemove(req.params.id, (err)=>{
		if(err){
			res.redirect("/ideas");}
		else{
			res.redirect("/ideas");
		}
	});
});

app.post("/prfl", (req, res)=>{
	user.find({username: req.body.search}, (err, foundUser)=>{
		if(err){
			res.render("/ideas");}
		else{ 
			if(foundUser[0]== undefined){res.redirect("/ideas");}
			else{res.redirect("/prfl/"+foundUser[0]._id);}
		}
	});
});

app.get("/prfl/:id", isLoggedIn, (req, res)=>{
	user.findById(req.params.id, (err, foundUser)=>{
		if(err){
			res.redirect("/ideas");
			console.log(err);
		}
		else{
			idea.find({"creator.userId": req.params.id}, (err, foundBlog)=>{
				if(err){
				res.render("/ideas");
				console.log(err);
				}
			else{
				res.render("account", {user: foundUser, items: foundBlog});
				}
			});
		}
	});
});

app.get("/prfl/:id/edit", isLoggedIn, (req, res)=>{
	user.findById(req.params.id, (err, foundUser)=>{
		if(err){
			res.redirect("/prfl/:id");
		}
		else{
			res.render("prfledit", {user: foundUser});
		}
	});
});

app.put("/prfl/:id", (req, res)=>{
	user.findByIdAndUpdate(req.params.id, {$set: {
		username: req.body.username,
		email: req.body.email,
		city: req.body.city,
		job: req.body.job,
		university: req.body.university
	}}, (err, updatedBlog)=>{
		if(err){
			res.redirect("/prfl/"+req.params.id+"/edit");}
		else{
			res.redirect("/prfl/"+req.params.id);
		}
	});
});

app.post("/sendRequest/:id", (req, res)=>{
	user.findById(req.params.id, (err, foundUser)=>{
		if(err){
			console.log(err);
		}
		else{
		user.findOne({"request.userId": req.user._id}, (err, foundUser2)=>{
			var reqUser= {userId : req.user._id,
						  username: req.user.username};
			var sent= {userId : req.params.id};
			if(foundUser2 == undefined){
				user.findByIdAndUpdate(req.params.id, {$push: {request: reqUser}}, (err, a)=>{});
				user.findByIdAndUpdate(req.user._id, {$push: {sentRequest: sent}}, (err, c)=>{});
			}	  
			else{
				user.findByIdAndUpdate(req.params.id, {$pull: {request: reqUser}}, (err, a)=>{});
				user.findByIdAndUpdate(req.user._id, {$pull: {sentRequest: sent}}, (err, c)=>{});
			}
		});
		}				   
	});	
});

app.post("/connect/:id", (req, res)=>{
	var friend, friend2;
	if(req.body.action=="Accept"){
		user.findById(req.params.id, (err, foundUser)=>{
			if(err){
				console.log(err);
			}
			else{
				friend= { friendId: foundUser.id,
					  	  friendName: foundUser.username};
				user.findByIdAndUpdate(req.user._id, {$push: {friendsList: friend}}, (err, a)=>{});
			}
		});
		friend2= { friendId: req.user._id,
				   friendName: req.user.username};
		user.findByIdAndUpdate(req.params.id, {$push: {friendsList: friend2}}, (err, b)=>{});
	}
	user.findByIdAndUpdate(req.params.id, {$pull: {sentRequest: {userId: req.user._id}}}, (err, c)=>{});
	user.findById(req.params.id, (err, foundUser)=>{	
	user.findByIdAndUpdate(req.user._id, {$pull: {request: {userId: req.params.id, username: foundUser.username}}}, (err, d)=>{});
	});
});

app.get("/prorequest/:id", isLoggedIn, (req, res)=>{
		user.findById(req.params.id, (err, foundUser)=>{
		if(err){
			res.redirect("/ideas");
			console.log(err);
		}
		else{
			res.render("prorequest", {user: foundUser});

		}
	});
});

app.get("/friend/:id", (req, res)=>{
	user.findById(req.params.id, (err, foundUser)=>{
		if(err){
			res.redirect("/ideas");
			console.log(err);
		}
		else{
			res.render("friend", {user: foundUser});

		}
	});
});

app.delete("/friend/:id",(req, res)=>{
	user.findById(req.params.id, (err, foundUser)=>{
	user.findByIdAndUpdate(req.user._id, {$pull: {friendsList: {friendId: req.params.id, friendName: foundUser.username}}}, (err, a)=>{});
	});
});

app.get("/*", (req, res)=>{
		res.send(" :-{(    Seems Like U r lost....");
		});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login")
}

app.listen(3000, function(){
	console.log("IdeaMate server is Live!!");
});
