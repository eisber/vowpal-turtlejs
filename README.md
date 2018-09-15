<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [readModel][1]
    -   [Parameters][2]
-   [predict][3]
    -   [Parameters][4]
    -   [Examples][5]

## readModel

[index.js:68-115][6]

### Parameters

-   `file` **[String][7]** vw --readable_file output
-   `cb` **[Function][8]** callback once the file is loaded, takes the loaded model as only argument

## predict

[index.js:145-158][9]

makes a prediction from a request and a model
the request is { namespaces: \[{name: 'some_namespace', features: [{name: 'some_feature', value: 1}]}]}

### Parameters

-   `model` **[Object][10]** mode loaded from @see readModel
-   `request` **[Object][10]** {.namespaces - array of namespaces, each of which has array of features}

### Examples

```javascript
var vw = require('vowpalturtle')
vw.readModel('readable_model.txt', (model) => {
    var prediction = vw.predict(model, {
        namespaces: [{
            name: 'something',
            features: [{
                name: 'a',
                value: 1
            }, {
                name: 'b',
                value: 1
            }, {
                name: 'c',
                value: 1
            }]
        }]
    });
    console.log(prediction)
});
```

Returns **[Float32Array][11]** prediction, one prediction per class (depending on oaa, by default 1)

[1]: #readmodel

[2]: #parameters

[3]: #predict

[4]: #parameters-1

[5]: #examples

[6]: https://github.com/jackdoe/turtlejs/blob/48d32d2931e9f6ddfa58c59f1290718b2259cf16/index.js#L68-L115 "Source code on GitHub"

[7]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[8]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[9]: https://github.com/jackdoe/turtlejs/blob/48d32d2931e9f6ddfa58c59f1290718b2259cf16/index.js#L145-L158 "Source code on GitHub"

[10]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[11]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Float32Array
