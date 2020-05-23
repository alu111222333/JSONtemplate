# JSON2HTML templates + Multilanguage support
JavaScript library for single-page web applications

# Installation
```html
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script type="text/javascript" src="path_to/json2html.js"></script>
```

# Basic request example
Library need JQuery for network requests. This is example code for processing data from server.
```javascript
J2H.getJSON("api/get_info.php",function (json){ //send request to API
    if (isGoodResponse(json)) {
        var html=J2H.process(template,"head",json); //insert data to template
        $('#content').html(html); //show result inside 'id=content' page item
    }
});

function isGoodResponse(json){
    if (json.error !== undefined && json.error.state !== undefined && json.error.state) {
        alert(json.error.title + "\n" + json.error.message); // replace to your own implementation
        return false;
    }
    return true;
}
```
Templates can use this 3 placeholders in HTML:
- **[\*variable\*]** - insert value from JSON data.
- **[!template,array!]** - process arrays.
- **{{template}}** - just show template.

For translation you can use:
- **@str.array_key** - this will be replaced by string from translation["array_key"]

Examples are below or in **example/** folder.


# Recommended code structure

* **/common** (some common elements like CSS, HTML, JavaScript, PHP, Python and etc.)
    * /api
    * /html
    * /js
    * /css
    * /img
* **/module1**
    * /api - (all Data models from server database)
        * api1_result.php
        * ...
    * /html - (all View elements and chunks in current module)
        * page_structure.html
        * header.html
        * content.html
        * ...
    * index.php - (control all events and process all data from server - Presenter)
* **/module2**
    * /api
    * /html
    * index.php
* .....
* **index.php** (main project file for navigation or iframes)


# Methods List
## Basic (only 3 methods)
* **loadTemplatesArray**(loaded_templates, ["url1","url2"...], function(){..})
    ```
    load multi-files templates with callback. Result in "loaded_templates" variable

    ```

* **process**(loaded_templates,"template_name",json_data)
     ```
    return is a HTML string. Parameter "loaded_templates" from method loadTemplatesArray(...)

    ```

* **setTranslationArray**(language_array)
    ```
    set translation array with keys as last part of "@str.key_name".
    Must be generated on server side accordingly to selected language.

    ```
## Extentions
* getJSON("url", function(json_data){..})
    ```
    send GET request with callback

    ```

* postJSON("url", json_data, function(json_data){..})
    ```
    send POST request  with callback

    ```

* translate(Object,["ke1","key2"..])
    ```
    Translate all strings in object with keys (optional).
    If you need to translate response from server.
    Templates are translated automatically.

    ```

* serializeHtmlForm(JQuery_object)
    ```
    extention for $(??).serializeArray() with unchecked checkboxes and arrays.
    You can use $(??).serializeHtmlForm()

    ```

## Debug
* printObject(Object, level)
    ```
    Return String with object content (Look below:[*vardump*]). Level is optional, default=1
    Also for logging in JS-console , you can set flag DEBUG=true at the top of library file.

    ```


# Parsing JSON into HTML
This library make a lot of work for converting data from JSON to HTML.
<br>
For example JSON
```javascript
{
    "data":{
        "id":123,
        "name":"Hello",
        "parameters":[{
            "param1":1,
            "param2":2
        },
        {
            "param1":11,
            "param2":22
        }]
    }
}
```
we want to show **name** from this JSON inside HTML.
```javascript
var templates={
        head:'<h1>[*data.name*]</h1>'
    };
```
And just call **J2H.process** like here
```javascript
    var html=J2H.process(templates,"head",json);
    $('#content').html(html); //insert result in page
```


Example2 with the same JSON as before:
```javascript
var templates={
        head:'<h1>[*data.name*]</h1>',
        table:'<table>[!table_row,data.parameters!]</table>',
        table_row:'<tr><td>[*param1*]</td><td>[*param2*]</td></tr>',
        all_page:'<h1>{{head}}</h1>{{table}}'
    };
var html=J2H.process(template,"all_page",json);
```
Content of html variable:
```html
<h1>Hello</h1>
<table>
    <tr><td>1</td><td>2</td></tr>
    <tr><td>11</td><td>22</td></tr>
</table>
```

OR you can generate only one row with template **table_row** and replace/add it to existing table
```javascript
var html=J2H.process(template,"table_row",json.data.parameters[0]);

//---- result ----
//<tr><td>1</td><td>2</td></tr>    
```

There are possible parameters to each placeholder like **IF** condition. I will describe it later in this document.


# Explanation
First what you need to know, is the order - how values are replaced in static HTML templates.

1) replace all **[\*variables\*]**
2) replace all arrays **[!array!]**
3) replace all templates **{{template}}**

So you can use variables for processing arrays and templates like that:
```html
 [!table_row[*some_value*],data.parameters!]
```
On first step [\*some_value\*] will be replaced. For example some_value=100. Then on second step:
```html
 [!table_row100,data.parameters!]
```
This is very bad idea, but sometimes may be useful.
Same situation with templates:
```html
 {{template[*some_value*]}} --> {{template100}}
```

# Using {{template}}


```javascript
var json={
        "data":{
            "id":123,
            "name":"Hello",
            "parameters":[{
                "param1":1,
                "param2":2
            },
            {
                "param1":11,
                "param2":22
            }]
        }
    }

var templates={
        table:'<table>[!table_row,data.parameters!]</table>',
        table_row:'<tr><td>[*param1*]</td><td>[*param2*]</td></tr>',
    };
var html=J2H.process(template,"table",json);
```
There are 2 ways how to how show only first row:

First as was describer before
```javascript
var html=J2H.process(template,"table_row",json.data.parameters[0]);
```
Second is to use parameters for template inside HTML code
```html
{{table_row,data.parameters.0}}
```
**,data.parameters.0** will change current parse level data for template to data.parameters[0]

This very usefull if you have same data on different levels.


# Using [\*variable\*]
```javascript
[*variable,if=`value||value2`then`TrueString`else`FalseString`*] //- show string depends of value

[*variable,ift=`value||value2||value3`then`TemplateTrue`else`TemplateFalse`*] //- show template depends of value

[*variable,ifb=`1**0*1`then`TrueString`else`FalseString`*] //- show string depends of bit mask. Check each bit to 0 and 1

[*variable,crop=`10`*] //- truncate variable to 10 chars

[*variable,replace=`abc`with`def`*] //- replace all "abc" to "def" in variable

[*variable,hash32*] //- show hash (MurmurHash3) of variable. Look: http://sites.google.com/site/murmurhash/
```


# Using [!template,array!]

Here you can use also if condition.
```javascript
[!template,array,if=`condition`] //- show items if condition is TRUE

[!template,array,limit=`100`] //- show first 100 items

[!template,array,default=`string`] //- show string if there is no data in array
```

You can combine all conditions into one
```javascript
[!template,array,if=`condition`,limit=`100`,default=`string`]
```

# Loading templates
Easiest way to create a templates is just create a variable in script that use this library
```javascript
var templateForCurrentPage={
    table: '<table>{{row}}</table>',
    row: '<tr><td>[*value*]</td></tr>'
};
```
You can also create a HTML file on server with template.
For example files **example_template.html** and **example_text.html**
```javascript
var templates = {};

function init() {
    //before loading any templates, you need to set translation array, if you want multilanguage support
    //Inline data from server as parameter e.g. PHP, Python and others, that check Cookie "lang" before generating JSON
    //Or AJAX request to server for json, and only after that you can load templates with "J2H.loadTemplatesArray"
    J2H.setTranslationArray(<?php echo(json_encode(transtale_array['en'])); ?>)
    J2H.loadTemplatesArray(templates, ["html/example_template.html", "html/example_text.html"], loadingCallback)
}

function loadingCallback() {
    //if all templates loaded correctly.
    //If this function was not called - some of the file is not exists
    buildWebUI();
}

init(); //Run it immediately after loading page HTML content
```

Also you can put few templates into one file separated by special keyword ( **NextTemplateName:** ).
Example **few_templates.html**
```html
NextTemplateName: users_table
<table class="table table-striped table-bordered">[!users_table_items,users!]</table>


NextTemplateName: users_table_items
<tr>
    <td nowrap width=8%>
        <a href=# style="color:black;" onClick="return users_edit([*id*]);">[*uname,crop=`30`*] [*usinfo*]</a>
    </td>
    <td align="center" style="vertical-align:middle;cursor:pointer;" width=4% onClick="return users_remove([*id*]);">
        <img src="../img/remove_icon.png" />
    </td>
</tr>
```
So it's possible to put all templates together in one file. **users_table** template use **users_table_items** for each element in array.
After loading this file its name will be ignored and name after **NextTemplateName:** will be taken. You can use this names for parsing data


# Translation
All templates are translated automatically if there is keywords in format "@str.array_key"

Key name not longer than 40 simbols.

If you nee to translate some response you can use function "J2H.translate(jsonObject,[keys])". Keys is optional.

Example:
```javascript
J2H.setTranslationArray({
    login_name:"User",
    user_description:"Description"
});
J2H.loadTemplatesArray(["url1_to_templates","url2_to_templates"],drawUI);

function drawUI(){
    //...
}
```

```html
NextTemplateName: users_table
<table class="table table-striped table-bordered">[!users_table_items,users!]</table>


NextTemplateName: users_table_items
<tr>
    <td nowrap width=8%>
        <a href=# style="color:black;" onClick="return false;">@str.login_name: [*uname*]</a>
    </td>
    <td>
        <a href=# style="color:black;" onClick="return false;">@str.user_description: [*usinfo*]</a>
    </td>

</tr>
```
