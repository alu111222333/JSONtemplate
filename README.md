# json2html
Lightweight JavaScript framework for single page web applications with Multilingual support. Minified framework version is less than 20K with zero dependencies.

Implemented: templating, components, network requests, translation on fly. This is all what is usually necessary in most of projects. **json2html.min.js** - can work with old browsers.
- [Installation](#installation)
- [Basic example](#basic-example)
- [Methods List](#methods-list)
    - [Basic](#basic-only-3-methods)
    - [Extentions](#additional)
    - [jQuery](#jquery)
    - [Debug](#debug)
- [Some examples and explanations](#parsing-json-into-html)
    - [**{{variable}}**](#using-variable)
    - [**{:template:}**](#using-template)
    - [**{+array,template+}**](#using-arraytemplate)
- [Loading templates/components](#loading-templates)
- [Multilanguage support](#multilanguage-support)
- [Recommended code structure](#recommended-code-structure)


# Installation
jQuery is NOT necessary.

Add to the end of file just before \</BODY\> tag:
```javascript
<script type="text/javascript" src="json2html.js"></script>
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
You can use **"json2html"** name or **"jth"** for access to [library methods](#basic-only-3-methods). In examples below "jth" prefix was used.

# Basic example
There was implemented FETCH with fallback to XMLHttpRequest. Example below show standard way of working with server response.

### Without jQuery:
```javascript
jth.getJSON("api/get_info.php",function (json){ //send request to API
    if (isGoodResponse(json)) {
        jth.inject2DOM(json,"page","#content"); //jth.executeJS will run automatically
    }
});
```

### With jQuery:
```javascript
jth.getJSON("api/get_info.php",function (json){ //send request to API
    if (isGoodResponse(json)) {
        $("#content").injectJSON(json,"page"); //jth.executeJS will run automatically
    }
});
```

### Advanced:
```javascript
jth.getJSON("api/get_info.php",function (json){ //send request to API
    if (isGoodResponse(json)) {
        let element=document.getElementById('content');
        let html=jth.render(json,"page");
        element.innerHTML=html;
        jth.executeJS(element); //optional: only if template have some JS-code (Component)
    }
});
```

### Templates files content
Simply HTML files with 3 special placeholers inside:
- **{{variable}}** - [insert value from JSON data](#using-variable)
- **{+array,template+}** - [process arrays](#using-arraytemplate)
- **{:template:}** - [just show template](#using-template)

For translation you can use:
- **@str.array_key** - [will be replaced to string](#translation) from translation["array_key"]

Examples are below or in **example/** folder.


# Methods List
## Basic (only 3 methods)
* **loadTemplatesArray**(["url1","url2"...], function(){..})
    ```
    load multi-files templates with callback. Result in "loaded_templates" variable

    ```

* **render**(json_data, "template_name")
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

* serializeHtmlForm(css_selector)
    ```
    serialize froms with unchecked checkboxes and arrays.

    ```

* inject2DOM(json_data, "template_name", css_selector)
    ```
    put created HTML code into DOM element with CSS selector

    ```

* executeJS(DOM_element)
    ```
    Execute JS inside element once. You don't need it if you use
    only plain HTML without active JavaScript code.

    Will run automatically inside functions:
    jth.inject2DOM(...) and $.injectJSON(...).
    But NOT in jth.render(...), must be called separately. Look example above.

    ```

## jQuery
if jQuery was added to HTML page library will create 2 extentions
* $.serializeHtmlForm()
    ```
    same as serializeHtmlForm(css_selector)

    ```

* $.injectJSON(data,"template_name")    
    ```
    inject HTML to each jQuery element. Return jQuery object.
    Example:
    $('#content').injectJSON(data,'template').fadeIn(300);

    ```

## Debug
* printObject(Object, level)
    ```
    Return String with object content (Look below:{{vardump}}). Level is optional, default=1
    Also for logging in JS-console , you can set flag DEBUG=true at the top of library file.

    ```

* setDebug(boolean)
    ```
    Enable debug mode. Disable debug output to console - setDebug(false);

    ```

# Parsing JSON into HTML
This library make a lot of work for converting data from JSON to HTML.

Example JSON
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
### Example-1
we want to show **name** from this JSON inside HTML.
```html
NextTemplateName: head
<h1>{{name}}</h1>
```
And just call **jth.render** like here
```javascript
    var html=jth.render(json,"head");
    $('#content').html(html); //insert result in page
```
### Example-2
```html
NextTemplateName: all_page
{:head:}{:table:}

NextTemplateName: head
<h1>{{name}}</h1>

NextTemplateName: table
<ul>{+parameters,table_row+}</ul>

NextTemplateName: table_row
<li>{{param1}}</li>
```
```javascript
var html=jth.render(json, "all_page");

//---- result ----
//<h1>Name</h1>
//<ul>
//    <li>1</li>
//    <li>3</li>
//</ul>
```
### Example-3
You can generate only one row from template **table_row**
```javascript
var html=jth.render(json.parameters[0],"table_row");

//---- result ----
//<li>1</li>    
```


# Using {{variable}}
Minimal manipulations with variables in JSON data
```javascript
{{variable,if=`value||value2`then`TrueString`else`FalseString`}} //- show string depends of value

{{variable,ift=`value||value2||value3`then`TemplateTrue`else`TemplateFalse`}} //- show template depends of value

[*variable,ifb=`1**0*1`then`TrueString`else`FalseString`}} //- show string depends of bit mask. Check each bit to 0 and 1

{{variable,crop=`10`}} //- truncate variable to 10 chars

{{variable,replace=`abc`with`def`}} //- replace all "abc" to "def" in variable

{{variable,hash32}} //- show MurmurHash3 of variable uniq for current library instance. Look: http://sites.google.com/site/murmurhash/

{{arr.length}} //- show length of variable if type is Array

{{instance_id}} //- uniq number for current template instance on page. Can be used for components to limit the scope of the Javascript. Components its the same as templates, but with code on javascript directly in the same template.

{{random}} //- display random value in range [1,100000]

{{vardump}} //- will show content of current variable

{{this.vardump}} //- same as {{vardump}} but with keyword "this"
```


# Using {:template:}
You can create simply HTML templates or Active Components with JS-code inside.
## Static Templates
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


--- templates.html content ---
NextTemplateName: table
<ul>{+parameters,table_row+}</ul>

NextTemplateName: table_row
<li>{{param1}}</td><td>{{param2}}</li>


--- javascript code ---
var html=jth.render(json,"table");
```
There are 2 ways how to how show only first row:

* First in JavaScript
```javascript
var html=jth.render(json.parameters[0],"table_row");
```
* Second in Templates
```html
{:table_row,parameters.0:}
```
**parameters.0** will change current variables scope for template to **parameters[0]**

This very usefull if you have same data on different levels.
## Components
The same as Static Templates but template have some JavaScript code.

For components better to use anonymous function and **{{instance_id}}** predefined variable
```javascript
--- component.html content ---
<div id="id{{instance_id}}">
    html content
</div>
<script type="text/javascript">
    // Wrap all components into anonymous function to avoid conflicts
    (function(uniq_id) {
        ...
    }('{{instance_id}}'))
</script>
```


# Using {+array,template+}
Here you can also use if condition (for details please read header of json2html.js).
```javascript
{+array,template,if=`condition`+} //- show items. Use "obj.property".

{+array,template,limit=`100`+} //- show first 100 items

{+array,template,default=`string`+} //- show string if there is no data in array
```

You can combine all conditions into one
```javascript
{+array,template,if=`condition`,limit=`100`,default=`string`+}
```

# Loading templates
You can create a HTML-template files on server and load all files with translated texts with only 2 strings of code.
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

You can put few templates into one file separated by special keyword  **NextTemplateName:**

Example **few_templates.html**
```html
NextTemplateName: users_table
<table>{+users,users_table_items+}</table>


NextTemplateName: users_table_items
<tr>
    <td nowrap width=95%>
        <a href=# onClick="return edit({{id}});">{{login,crop=`30`}} : {{info}}</a>
    </td>
    <td width=5% onClick="return remove({{id}});">
        <img src="remove_icon.png" />
    </td>
</tr>
```
So it's possible to put all templates together in one file.
FileName will be ignored and only name after **NextTemplateName:** will be taken. You can use this names for rendering data


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
        <a href=#>@str.login_name: {{uname}}</a>
    </td>
</tr>
```

If you need to translate some response, you can use function "jth.translate(json,[keys])". Keys parameter is optional.

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
   Browser                 Server
|-----------|            |-------|
|   index   |--- AJAX -->|  API  |
|~~~~~^~~~~~|            |-------|
|~~~~~|~~~~~|                |
|   HTML    |<-----JSON------|
|-----------|
```
