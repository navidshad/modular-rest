let validateObject = require('./class/validator');
const userManager = require('./services/user_manager/service');

module.exports.auth = async (ctx, next) => 
{
    let headers = ctx.header;
    let headersValidated = validateObject(headers, 'authorization');

    if(!headersValidated.isValid)
        ctx.throw(401 , 'authentication is required');
        
    let token = headers.authorization;
    
    await userManager.main.getUserByToken(token)
        .then(async user => 
        {
            ctx.state.user = user;
            await next();
        })
        .catch(err => {
            console.log(err);
            ctx.throw(err.status || 412, err.message);
        });
}