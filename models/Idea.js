var mongoose   = require("mongoose")
var IdeaSchema = new mongoose.Schema({
	title: String,
	details: String,
	city: String,
	creator: {userId: String,
			  username: {type: String, default: ''}
			 },
	img: { 
        data: Buffer, 
        contentType: String 
    },
	likes_count:  { type: Number, default: 0 }
});
module.exports = mongoose.model("idea", IdeaSchema);