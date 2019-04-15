# JSONtemplate
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
JSONTemplate.getJSON("api/get_users.php",function (json){ //send request to API
    if(!showErrorIfExists(json)){ //check if this is a error response
        var html=JSONTemplate.parse_template(template,"users_structure",json); //insert data to template
        $('#content').html(html); //show result inside 'id=content' page item
    }else{
        $('#content').html('error already visible');
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

[\*variable,if=`value||value2`then`show_true_string`else`show_false_string`\*] - show string depends of value

[\*variable,ift=`value||value2||value3`then`template_true`else`template_false`\*] - show template depends of value

[\*variable,ifb=`**1**0*1`then`show_true_string`else`show_false_string`\*] - show string depends of bit mask

[\*variable,crop=`10`\*] - truncate variable to 10 chars

[\*variable,replace=`abc`with`cde`\*] - replace all "abc" to "cde" in variable

[\*variable,hash32\*] - show hash (MurmurHash3) of variable. Look: http://sites.google.com/site/murmurhash/

others i will describe it later

# Using arrays [!template,array!]

Here you can use also if condition. And pagination for list.

[!template,array,if=`condition`] - show items if condition is TRUE

[!template,array,paginator=`settings`] - split items to pages by settings and show pagination UI element in exact place

[!template,array,limit=`100`] - show first 100 items

[!template,array,default=`string`] - show string if there is no data in array


You can combine all conditions into one

[!template,array,if=`condition`,limit=`100`,default=`string`,paginator=`settings`]
[!template,array,if=`condition`]
