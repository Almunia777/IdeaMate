var stat= function(user, reqId){
	user.forEach(function(ids){
		if(ids==reqId){
			return 1;
		}
	});
}