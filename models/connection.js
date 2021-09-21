var mongoose   = require("mongoose")
var ConnectionSchema = new mongoose.Schema({
	sentRequest:[{
	username: {type: String, default: ''}
}],
	request: [{
			userId: {type: String},
			username: {type: String, default: ''}
		}],
	friendsList: [{
			friendId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
			friendName: {type: String, default: ''}
		}],
		totalRequest: {type: Number, default:0}
});
module.exports = mongoose.model("connect", ConnectionSchema);