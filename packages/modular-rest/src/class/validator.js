module.exports = function(obj, requiredFields)
{
    /*
        this method could validate an Object by given field's name list and return bool.
        - requiredFields: is a string that contains keys being spareted by " ".
    */
    let type = typeof requiredFields;
    let result;

    if(type == 'string') 
        result = ckeckSimple(obj, requiredFields);
    else if(type == 'object')
        result = checkComplex(obj, requiredFields);

    else throw('requiredFields has wrong form, it must be string or object');

    return result;
}

function ckeckSimple(obj, requiredFields='')
{
    let isValide = false;
    let requires = requiredFields.split(' ');

    let validMembers = 0;
    let notValidKeys = [];

    // return if obj is null
    if(obj == null) return _returnResult(isValide, requires);

    requires.forEach(key =>
    {
        if (obj[key]) 
            validMembers++;
        else notValidKeys.push(key);
    });
        
    // check validation
    isValide = (requires.length == validMembers) ? true : false;
    return _returnResult(isValide, notValidKeys);
}

function checkComplex(obj, requiredFields={})
{
    let isValide = false;
    let requireKeys = Object.keys(requiredFields);

    let validMembers = 0;
    let notValidKeys = [];

    // return if obj is null
    if(obj == null) return _returnResult(isValide, requireKeys);

    for (let i = 0; i < requireKeys.length; i++) 
    {
        const key = requireKeys[i];
        let isValidField = false;

        // if field has specific values
        if(requiredFields[key].length > 0)
        {
            let expectedValues = requiredFields[key].split(' ');

            if(typeof expectedValues != 'object')
                throw(`${key} must be array of strings`);

            expectedValues.forEach(value => {
                if(obj[key] == value) isValidField = true;
            })
        }
        // else does not has specific value
        else if(obj[key] != null) isValidField = true;

        if (isValidField) validMembers++;
        else notValidKeys.push(key);
    }
        
    // check validation
    isValide = (requireKeys.length == validMembers) ? true : false;
    return _returnResult(isValide, notValidKeys);
}

function _returnResult(isValide, notValidKeys)
{
    return {'isValid': isValide, 'requires': notValidKeys};
}