// generate structured respons json
module.exports.create = function(status, detail={})
{
    /* result template
    * status : "success", "fail", "error",
    * data : {},
    * error: {},
    * message: "...",
    * more detail
    */

    let result = detail || {};

    // defin status
    switch (status) {
        case 's':
            result['status'] = 'success';
            break;

        case 'f':
            result['status'] = 'fail';
            break;
    
        case 'e':
            result['status'] = 'error';
            break;

        default:
            result['status'] = 'success';
            break;
    }

    // return
    return result;
}