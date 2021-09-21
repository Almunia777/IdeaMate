var mongoose              = require("mongoose"),
	passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username : String,
	email: String,
	password : String,
	city: String,
	job: {type: String, default: 'Unknown'},
	university: {type: String, default: 'Unknown'},
	sentRequest:[{
		userId: {type: String, default: ''},
		}],
	request: [{
			userId: String,
			username: {type: String, default: ''}
		}],
		friendsList: [{
			friendId: {type: String, default: ''},
			friendName: {type: String, default: ''}
		}],
		totalRequest: {type: Number, default:0}
})

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", UserSchema);