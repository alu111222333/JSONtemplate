# JSONtemplate + Multilanguage support
JS library for single-page web applications

# Parsing JSON into HTML
This library take a lot of work for inserting data from JSON to HTML templates.
This is short documentation about this library.
<br>
For example we work with this JSON
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
if we want to show **name** from this JSON, we need to create HTML template
```javascript
var templates={
        head:'<h1>[*data.name*]</h1>'
    };
```
And just call **JSONTemplate.parse_template** like in this example
```javascript
    var html=JSONTemplate.parse_template(templates,"head",json);
    $('#content').html(html); //insert result in page
```
Also possible to process arrays. There all possible commands for JSON templater
- **[\*json.variable.value\*]** - insert value from JSON
- **[!template,json.variable.array!]** - process array. Each element inserter in template
- **{{template}}** - just show template with current data

Example2 with the same JSON as before:
```javascript
var templates={
        head:'<h1>[*data.name*]</h1>',
        table:'<table>[!table_row,data.parameters!]</table>',
        table_row:'<tr><td>[*param1*]</td><td>[*param2*]</td></tr>',
        all_page:'<h1>{{head}}</h1>{{table}}'
    };
var html=JSONTemplate.parse_template(template,"all_page",json);
```
Result in html variable:
```html
<h1>Hello</h1>
<table>
    <tr><td>1</td><td>2</td></tr>
    <tr><td>11</td><td>22</td></tr>
</table>
```
This will put in html variable text, that can be inserted in any place of current HTML document.
OR you can generate not all page, but create only one row with template **table_row** and replace/add it to existing table
```javascript
var html=JSONTemplate.parse_template(template,"table_row",json.data.parameters[0]);

//---- result ----
//<tr><td>1</td><td>2</td></tr>    
```

There possible additional functions in first 2 types like **IF** condition. I will describe it later.

# Basic request example
We use JQuery for requests. Here is some example code for inserting data from server.
```javascript
JSONTemplate.getJSON("api/get_info.php",function (json){ //send request to API
    if (json.error !== undefined && json.error.state !== undefined && json.error.state) {
        //display error message from json.error.title and json.error.message
        alert(json.error.title + "\n" + json.error.message);
        //OR
        $('#content').html('show error info if needed');
    } else {
        var html=JSONTemplate.parse_template(template,"info_structure",json); //insert data to template
        $('#content').html(html); //show result inside 'id=content' page item
    }
});
```
And this code can be used everywere in project

# Explanation
First what you need to know, is order how values are replaced in HTML templates.

In current template:
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
This sometimes may be usefull.
Same situation with templates:
```html
 {{template[*some_value*]}} --> {{template100}}
```

# Using templates {{template}}

there is some additional feature to use templates. Its more easy then others, that is why i describe it first.
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
var html=JSONTemplate.parse_template(template,"table",json);
```
There 2 ways how to how show only first row:

First as was describer before
```javascript
var html=JSONTemplate.parse_template(template,"table_row",json.data.parameters[0]);
```
Second is to use parameters for template inside HTML code
```html
{{table_row,data.parameters.0}}
```
**,data.parameters.0** will change current parse level data for template to data.parameters[0]

This very usefull if you have same data on different levels.

# Using variables [\*variable\*]
```javascript
[*variable,if=`value||value2`then`TrueString`else`FalseString`*] //- show string depends of value

[*variable,ift=`value||value2||value3`then`TemplateTrue`else`TemplateFalse`*] //- show template depends of value

[*variable,ifb=`1**0*1`then`TrueString`else`FalseString`*] //- show string depends of bit mask. Check each bit to 0 and 1

[*variable,crop=`10`*] //- truncate variable to 10 chars

[*variable,replace=`abc`with`def`*] //- replace all "abc" to "def" in variable

[*variable,hash32*] //- show hash (MurmurHash3) of variable. Look: http://sites.google.com/site/murmurhash/
```
others i will describe it later

# Using arrays [!template,array!]

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
    //Or AJAX request to server for json, and only after that you can load templates with "JST.loadTemplateUrlsArray"
    JST.setTranslationAssociativeArray(<?php echo(json_encode(transtale_array['en'])); ?>)
    JST.loadTemplateUrlsArray(templates, ["html/templates.html"], loadingCallback)
}

function loadingCallback() {
    //if all templates loaded correctly.
    //If this function was not called - some of the file is not exists
    buildWebUI();
}

init(); //Run it immediately after loading page HTML content
```

Also you can put few templates into one file splited by special keyword.
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
So you put all templates that used together in one place. **users_table** template use **users_table_items** for each element in array.
After loading this file its name will be ignored and name after **NextTemplateName:** will be taken. You can use this names for parsing data

# Translation
All templates are translated automatically if there is keywords in format "@str.array_key"

If you nee to translate some response you can use function "JST.translateObject(jsonObject,[keys])". Keys is optional.
