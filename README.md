# JSON2HTML templates + Multilanguage support
JavaScript library for single-page web applications
- [Installation](#installation)
- [Basic example](#basic-example)
- [Recommended code structure](#recommended-code-structure)
- [Methods List](#methods-list)
    - [Basic](#basic-only-3-methods)
    - [Extentions](#additional)
    - [Debug](#debug)
- [Some examples and explanations](#parsing-json-into-html)
    - [**{{template}}**](#using-template)
    - [**\[\*variable\*\]**](#using-variable)
    - [**\[!template,array!\]**](#using-templatearray)
- [Loading templates from files](#loading-templates)
- [Multilanguage support](#multilanguage-support)

# Installation
jQuery is NOT necessary for this library. But you can use it ;-)
```html
<script type="text/javascript" src="path_to/json2html.js"></script>
```

And at the end of file
```javascript
<script type="text/javascript">
    function init() {
        jth.setTranslationArray(translates.en); // optional
        jth.loadTemplatesArray(["html/templates.html"], loadingCallback);
    }

    function loadingCallback() {
        buildWebUI();
    }

    init(); //Run it immediately after loading page
    //...
</script>
```
You can use **"json2html"** name or **"jth"** for access to [library methods](#basic-only-3-methods). In examples below i use "jth" prefix.

# Basic example
Library not use jQuery for network requests. Was implemented FETCH and XMLHttpRequest for fallback capability. Example below show standard way to work with server response.
```javascript
jth.getJSON("api/get_info.php",function (json){ //send request to API
    if (isGoodResponse(json)) {
        var html=jth.process("head",json); //insert data to template
        $('#content').html(html); //show result inside 'id=content' page item
    }
});
```
Templates can use this 3 placeholders in HTML:
- **[\*variable\*]** - [insert value from JSON data](#using-variable)
- **[!template,array!]** - [process arrays](#using-templatearray)
- **{{template}}** - [just show template](#using-template)

For translation you can use:
- **@str.array_key** - [will be replaced to string](#translation) from translation["array_key"]

Examples are below or in **example/** folder.


# Recommended code structure
I suppose better to use iframes for each module. In this case you will never have a conflicts
and don't need to load all JS-libraries that needed in your WHOLE project.


* **/common**
    * /api - (common functions for server JSON API on PHP/Python)
    * /html - (view elements that needed in few places in project)
    * /js - (here can be implementer function **isGoodResponse(json)** and others)
    * /css
    * /img
* **/module1**
    * /api - (data response from server database)
        * api_result.php
        * ...
    * /html - (view elements in current module)
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
* **index.php** (entry point for iframes navigation)

### Schema in each module
Clients browsers became more powerful every year. It's very silly to build all
HTML pages on server side if this work can be done on client with JavaScript.
This will save server time and money.
```
   Browser                    Server
|-----------|               |-------|
|   index   |----- AJAX --->|  API  |
|~~~~~^~~~~~|               |-------|
|~~~~~|~~~~~|                   |
|   HTML    |<------JSON--------|
|-----------|
```

# Methods List
## Basic (only 3 methods)
* **loadTemplatesArray**(["url1","url2"...], function(){..})
    ```
    load multi-files templates with callback. Result in "loaded_templates" variable

    ```

* **process**("template_name",json_data)
     ```
    return is a HTML string created from HTMLs loaded by loadTemplatesArray(...)

    ```

* **setTranslationArray**(language_array)
    ```
    set translation array with keys as last part of "@str.key_name".
    Must be generated on server side accordingly to selected language.

    ```
## Additional
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

* setDebug(boolean)
    ```
    Enable debug mode. Disable debug output to console - setDebug(false);

    ```

# Parsing JSON into HTML
This library make a lot of work for converting data from JSON to HTML.
<br>
For example JSON
```javascript
{
    "name":"Name",
    "parameters":[{
        "param1":1,
    },
    {
        "param1":3,
    }]
}
```
we want to show **name** from this JSON inside HTML.
```javascript
var templates={
        head:'<h1>[*name*]</h1>'
    };
```
And just call **jth.process** like here
```javascript
    var html=jth.process("head",json);
    $('#content').html(html); //insert result in page
```


Example2 with the same JSON as before:
```javascript
var templates={
        head:'<h1>[*name*]</h1>',
        table:'<ul>[!table_row,parameters!]</ul>',
        table_row:'<li>[*param1*]</li>',
        all_page:'<h1>{{head}}</h1>{{table}}'
    };
var html=jth.process("all_page",json);
```
Content of html variable:
```html
<h1>Name</h1>
<ul>
    <li>1</li>
    <li>3</li>
</ul>
```

OR you can generate only one row with template **table_row** and replace/add it to existing list
```javascript
var html=jth.process("table_row",json.parameters[0]);

//---- result ----
//<li>1</li>    
```

There are possible parameters to each placeholder like **IF** condition. I will describe it later in this document.


# Explanation
First what you need to know, is the order - how values are replaced in static HTML templates.

1) replace all **[\*variables\*]**
2) replace all arrays **[!array!]**
3) replace all templates **{{template}}**

So you can use variables for processing arrays and templates like that:
```html
 [!table_row[*some_value*],parameters!]
```
On first step [\*some_value\*] will be replaced. For example some_value=100. Then on second step:
```html
 [!table_row100,parameters!]
```
This is very bad idea, but sometimes may be useful.
Same situation with templates:
```html
 {{template[*some_value*]}} --> {{template100}}
```

# Using {{template}}


```javascript
var json={
    "name":"Name",
    "parameters":[{
        "param1":1,
    },
    {
        "param1":3,
    }]
}

var templates={ //loaded from file and already injected in library
        table:'<ul>[!table_row,parameters!]</ul>',
        table_row:'<li>[*param1*]</td><td>[*param2*]</li>',
    };
var html=jth.process("table",json);
```
There are 2 ways how to how show only first row:

First as was describer before
```javascript
var html=jth.process("table_row",json.parameters[0]);
```
Second is to use parameters for template inside HTML code
```html
{{table_row,parameters.0}}
```
**parameters.0** will change current variables scope for template to **parameters[0]**

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
[!template,array,if=`condition`] //- show items. Use "obj.property". Read header of json2html.js

[!template,array,limit=`100`] //- show first 100 items

[!template,array,default=`string`] //- show string if there is no data in array
```

You can combine all conditions into one
```javascript
[!template,array,if=`condition`,limit=`100`,default=`string`]
```

# Loading templates
You can create a HTML file on server with templates.
For example files **example_template.html** and **example_text.html**
```javascript

function init() {
    //before loading any templates, you need to set translation array, if you want multilanguage support
    //Inline data from server as parameter e.g. PHP, Python and others, that check Cookie "lang" before generating JSON
    //Or AJAX request to server for json, and only after that you can load templates with "jth.loadTemplatesArray"
    jth.setTranslationArray(<?php echo(json_encode(transtale_array['en'])); ?>)
    jth.loadTemplatesArray(["html/example_template.html", "html/example_text.html"], loadingCallback)
}

function loadingCallback() {
    //if all templates loaded correctly.
    //If this function was not called - some of the file is not exists
    buildWebUI();
}

init(); //Run it immediately after loading page HTML content
```

Also you can put few templates into one file separated by special keyword  **NextTemplateName:**

Example **few_templates.html**
```html
NextTemplateName: users_table
<table>[!users_table_items,users!]</table>


NextTemplateName: users_table_items
<tr>
    <td nowrap width=95%>
        <a href=# onClick="return edit([*id*]);">[*login,crop=`30`*] : [*info*]</a>
    </td>
    <td width=5% onClick="return remove([*id*]);">
        <img src="remove_icon.png" />
    </td>
</tr>
```
So it's possible to put all templates together in one file. **users_table** template use **users_table_items** for each element in array.
After loading this file its name will be ignored and name after **NextTemplateName:** will be taken. You can use this names for parsing data


# Multilanguage support
All templates are translated automatically while loading, if there is a keywords present in format "@str.array_key"

Key name not longer than 40 simbols.

Example:
```javascript
jth.setTranslationArray({
    login_name:"User",
    ...
});
// all templates will be translated right after loading. You don't need to do anything additionally
jth.loadTemplatesArray(["templates_url"],drawUI);

function drawUI(){
    //...
}
```

Example of template with **@str.** prefix-strings
```html
NextTemplateName: users_table_item
<tr>
    <td>
        <a href=#>@str.login_name: [*uname*]</a>
    </td>
</tr>
```

If you need to translate some response, you can use function "jth.translate(json,[keys])". Keys parameter is optional.
