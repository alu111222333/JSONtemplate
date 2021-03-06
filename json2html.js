/**
 * The simplest "JSON->HTML" templater with multilanguage support
 * Author: Leonid Arefev
 * Started: 11-05-2013
 * GitHub: https://github.com/wtf-develop/json2html
 * Web: http://wtf-dev.ru/
 */

// Wrap all widget code into anonymous function expression to avoid conflicts
// that may occur with another code on the page (module pattern).

if ((jth === undefined) || (json2html === undefined)) {
    var json2html = (function() {
        "use strict";
        let DEBUG = false;
        let CORS = false; //cross origin requests.
        const translate_prefix = '@str.';

        // Recommended to keep current values of j_var, j_loop and j_templ.
        // But if you want, you can change it. Then test everything again.
        // 2-3 simbols for open tag and 2-3 simbols for closing tag.
        // don't create values as subset of already used values
        // if "{{" in use don't use "{{#"
        const j_var = ['{{', '}}']; // 2-3 simbols for each not more, not less
        const j_loop = ['{+', '+}']; // 2-3 simbols for each not more, not less
        const j_templ = ['{:', ':}']; // 2-3 simbols for each not more, not less


        /**
        // [!template,array,if=`(expression)`!] - content filter
        // expression: JavaScript boolen expression. + can be used: in_array(arr,value)
        // - TRUE item will be processed
        // - FALSE item will be ignored
        // - use prefix "obj." to access item properties
        // - Javascript expression will run in eval() function if there is something
        // - was undefined - result will be FALSE
        // - use this fix UNDEFINED problem:
             (("prop" in obj) ? obj.prop : "default")

        // - or be sure than this field always exists in response from server
        */

        /**
         // Recommended server error response format
         // {"error":{"state":true,"title":"ErrorTitle","message":"ErrorMessage","code":intErrorCode}}
         */

        function in_array(arr, value, iswildcast) {
            let wildcast = (typeof iswildcast == 'undefined') ? false : iswildcast;
            if (value === undefined || value == null || value.length == 0) {
                return false;
            }
            let accepted = '';
            for (let key in arr) {
                accepted = arr[key];
                if (accepted == value) {
                    return true;
                } else if (wildcast) {
                    let ind = accepted.indexOf('*');
                    if (ind == 0) {
                        if (value.endsWith(accepted.substr(1))) {
                            return true;
                        }
                    } else if (ind == accepted.length - 1) {
                        if (value.startsWith(accepted.substr(0, accepted.length - 1))) {
                            return true;
                        }
                    }

                }
            }
            return false;
        }


        let error_parcer = '';
        let template_instance_id = Math.floor((Math.random() * 999) + 1); //random inital value

        function get_from_data(temp_data, name_var, uniq_instance_id) {
            if (name_var === undefined) {
                if (DEBUG) {
                    alert('Json2Html: CRITICAL error. Varialble name is undefined. Check your loop templates')
                }
                debug_log('CRITICAL error. Varialble name is undefined. Check your loop templates');
                return '';
            }
            name_var = my_trim(name_var);
            let i = 0;
            let name_vars = name_var.split('.');
            let local_parent_index = data_parent_index;
            for (i = 0; i < name_vars.length; i++) {
                name_vars[i] = removePairedBorderQuotes(my_trim(name_vars[i]));
                if (name_vars[i] == 'this') {
                    continue;
                };
                if (name_vars[i] == 'vardump') {
                    return printObject(temp_data);
                };
                if ((name_vars[i] == 'length') && (Array.isArray(temp_data))) {
                    return temp_data.length;
                }
                if (name_vars[i] == 'random') {
                    return Math.floor((Math.random() * 100000) + 1);
                }
                if (name_vars[i] == 'instance_id') {
                    return uniq_instance_id;
                }
                if (name_vars[i] == 'parent') {
                    if (local_parent_index > 0) {
                        local_parent_index--;
                        temp_data = data_parent_array[local_parent_index];
                    } else {
                        if (DEBUG) {
                            error_parcer = error_parcer + 'Parent not exists for 0 element';
                        }
                    }
                    continue;
                };


                if (temp_data !== undefined && temp_data !== null && temp_data[name_vars[i]] !== undefined) {
                    temp_data = temp_data[name_vars[i]];
                } else {
                    if (DEBUG) {
                        if (error_parcer.indexOf(name_vars[i]) == -1) {
                            error_parcer = error_parcer + name_vars[i] + ' in (' + name_var + ')\n';
                        };
                    };
                    temp_data = '';
                    break;
                }
            }
            if (temp_data === undefined || temp_data === null) {
                temp_data = '';
            }

            return temp_data;
        }

        function removePairedBorderQuotes(s) {
            if (s === null) return '';
            if (typeof s != 'string') return s;
            if (s.length < 3) return s;
            if (s.charAt(0) == '"' && s.charAt(s.length - 1) == '"') {
                s = s.substr(1, s.length - 2);
            }
            if (s.charAt(0) == "'" && s.charAt(s.length - 1) == "'") {
                s = s.substr(1, s.length - 2);
            }
            if (s.charAt(0) == "`" && s.charAt(s.length - 1) == "`") {
                s = s.substr(1, s.length - 2);
            }
            return s;
        }


        function bit_test(num, bit) {
            return ((num >> bit) % 2 != 0)
        }

        let data_parent_array = [];
        let data_parent_index = -1;

        let level_parce = 0; //stack overflow protection
        //function change HTML code with templates to HTML code with data.
        function render(data, name) {
            //check stack overflow
            ///********************** filter sub-functions start ***************************
            let global_filter = '';
            let templates = shadow_templates_object;
            let local_template_instance_id = template_instance_id;
            template_instance_id++;

            function set_filter(f) {
                global_filter = f;
                global_filter = str_replace('if=`', '', global_filter);
                global_filter = str_replace('`', '', global_filter);
                global_filter = my_trim(global_filter);
                if (global_filter.length < 1) {
                    return false;
                };
                return true;
            }

            function check_filter(obj) {
                if (global_filter.length < 1) {
                    return true;
                };
                let notObfuscate = {
                    'obj': obj,
                    'func': function() {
                        return Boolean(eval('function __hey(obj){return (' + global_filter + ');}; __hey(this.obj);'));
                    }
                };
                try {
                    return notObfuscate.func();
                } catch (e) {
                    debug_log('debug error in filter!' + "\n" + global_filter + "\n" + e.name);
                };
                return false;
            }
            //*********************** filter sub-functions end ****************************


            name = my_trim(removePairedBorderQuotes(name));
            let limits = -1;
            let defaultString = '';
            let defaultTemplate = '';
            let page = 0;
            let variable = '';
            if (level_parce == 0) {
                data_parent_array = [data];
                data_parent_index = 0;
                if (DEBUG) error_parcer = '';
            } else {
                data_parent_array.push(data);
                data_parent_index++;
                if (data_parent_index >= data_parent_array.length || data_parent_index < 0) {
                    data_parent_index = data_parent_array.length - 1
                }
            }
            if (level_parce > 15) {
                debug_log('stack overflow in parser detect');
                return '';
            }
            if (templates[name] === undefined) {
                debug_log('template ' + name + ' is UNDEFINED');
                return '';
            };
            level_parce++;
            let str = templates[name];
            let ind_s = 0;
            let ind_e = 0;
            let name_template, trunc_str, then_v, else_v, name_var, name_var2, name_vars, temp, i, temp_template, temp_str, temp_data;
            trunc_str = -1;
            let replace = -1;
            let replaceFrom = '';
            let replaceTo = '';
            let hash = -1;
            let if_type = -1;

            ///parse JSON data variables
            ///parse JSON data variables
            ///parse JSON data variables
            ind_s = 0;
            ind_e = 0;

            while (str.indexOf(j_var[0], ind_s) != -1) {
                ind_s = str.indexOf(j_var[0], ind_s);
                ind_e = str.indexOf(j_var[1], ind_s + j_var[0].length);
                trunc_str = -1;
                replace = -1;
                hash = -1;
                replaceFrom = '';
                replaceTo = '';
                if_type = -1;
                then_v = '';
                else_v = '';
                variable = '';
                if ((ind_e != -1) && ((ind_e - ind_s) < 200) && ((ind_e - ind_s) > 0)) {
                    name_var = str.substr(ind_s + j_var[0].length, ind_e - (ind_s + j_var[0].length));
                    name_var2 = name_var;
                    variable = '';
                    if (name_var.indexOf(',') != -1) {
                        variable = name_var.split(',');
                        name_var2 = variable[0];
                        if ((variable[1] !== undefined) && (variable[1].indexOf('hash32') == 0)) {
                            hash = 1;
                            variable = '';
                        } else if ((variable[1] !== undefined) && (variable[1].indexOf('replace=') != -1)) {
                            if (variable[1].indexOf('`with`') != -1) {
                                variable[1] = variable[1].split('`with`');
                                replaceFrom = variable[1][0];
                                replaceTo = variable[1][1];
                                replaceFrom = str_replace('replace=', '', replaceFrom);
                                replaceFrom = str_replace('`', '', replaceFrom);
                                replaceTo = str_replace('replace=', '', replaceTo);
                                replaceTo = str_replace('`', '', replaceTo);
                                if (replaceFrom.length > 0) {
                                    replace = replaceFrom.length;
                                } else {
                                    replace = -1;
                                }
                            }
                            variable = '';
                        } else if ((variable[1] !== undefined) && (variable[1].indexOf('trunc=') != -1)) {
                            trunc_str = parseInt(removePairedBorderQuotes(str_replace('trunc=', '', variable[1])));
                            if (trunc_str < 1) trunc_str = -1;
                            variable = '';
                        } else if ((variable[1] !== undefined) && (variable[1].indexOf('ift=`') != -1)) {
                            if_type = 1;
                            then_v = '';
                            else_v = '';

                            if (variable[1].indexOf('`then`') != -1) {
                                variable[1] = variable[1].split('`then`');
                                then_v = variable[1][1];
                                else_v = then_v.split('`else`');
                            } else {
                                then_n = undefined
                                else_v = variable[1].split('`else`');
                            }
                            if (else_v[1] === undefined) {
                                else_v = undefined;
                            } else {
                                then_v = else_v[0];
                                else_v = else_v[1];
                            }
                            variable[1] = str_replace('ift=', '', variable[1][0]);
                            variable[1] = my_trim(str_replace('`', '', variable[1]));
                            if (else_v !== undefined) else_v = my_trim(str_replace('`', '', else_v));
                            if (then_v !== undefined) then_v = my_trim(str_replace('`', '', then_v));
                        } else if ((variable[1] !== undefined) && ((variable[1].indexOf('ifc=`') != -1) || (variable[1].indexOf('if=`') != -1))) {
                            if_type = 2;
                            then_v = '';
                            else_v = '';
                            if (variable[1].indexOf('`then`') != -1) {
                                variable[1] = variable[1].split('`then`');
                                then_v = variable[1][1];
                                else_v = then_v.split('`else`');
                            } else {
                                then_n = undefined
                                else_v = variable[1].split('`else`');
                            }


                            if (else_v[1] === undefined) {
                                else_v = undefined;
                            } else {
                                then_v = else_v[0];
                                else_v = else_v[1];
                            }
                            if (variable[1][0].indexOf('ifc=') != -1) {
                                variable[1] = str_replace('ifc=', '', variable[1][0]);
                            } else {
                                variable[1] = str_replace('if=', '', variable[1][0]);
                            }
                            variable[1] = my_trim(str_replace('`', '', variable[1]));
                            if (else_v !== undefined) else_v = my_trim(str_replace('`', '', else_v));
                            if (then_v !== undefined) then_v = my_trim(str_replace('`', '', then_v));
                        } else if ((variable[1] !== undefined) && (variable[1].indexOf('ifb=`') != -1)) {
                            if_type = 3;
                            then_v = '';
                            else_v = '';
                            if (variable[1].indexOf('`then`') != -1) {
                                variable[1] = variable[1].split('`then`');
                                then_v = variable[1][1];
                                else_v = then_v.split('`else`');
                            } else {
                                then_n = undefined
                                else_v = variable[1].split('`else`');
                            }


                            if (else_v[1] === undefined) {
                                else_v = undefined;
                            } else {
                                then_v = else_v[0];
                                else_v = else_v[1];
                            }
                            variable[1] = str_replace('ifb=', '', variable[1][0]);
                            variable[1] = my_trim(str_replace('`', '', variable[1]));
                            if (else_v !== undefined) else_v = my_trim(str_replace('`', '', else_v));
                            if (then_v !== undefined) then_v = my_trim(str_replace('`', '', then_v));
                        } else {
                            variable = '';
                        }
                    }
                    temp = get_from_data(data, name_var2, local_template_instance_id);
                    if (hash > 0) {
                        temp = murmurhash3_32_gc(temp);
                    } else if (replace > 0) {
                        temp = str_replace(replaceFrom, replaceTo, temp);
                    } else if (trunc_str > 0) {
                        if (temp.length > trunc_str) temp = temp.substr(0, trunc_str) + "...";
                    } else if ((if_type == 1 || if_type == 2) && variable[1] !== undefined) {
                        let checkWithThis = variable[1].toString().toUpperCase();
                        let eqWithThis = false;
                        if (checkWithThis.indexOf('||') != -1) {

                            let checkArr = checkWithThis.split('||');
                            let checkFor = 0;
                            for (checkFor = 0; checkFor < checkArr.length; checkFor++) {
                                if (eqWithThis) continue;
                                eqWithThis = temp.toString().toUpperCase() == (checkArr[checkFor]);
                                if (eqWithThis) {
                                    break;
                                }
                            }
                        } else {
                            eqWithThis = temp.toString().toUpperCase() == checkWithThis;
                        }
                        if (eqWithThis) {
                            if (then_v !== undefined && then_v != '') {
                                if (if_type == 1) {
                                    temp = render(data, then_v);
                                } else {
                                    temp = my_trim(removePairedBorderQuotes(then_v));
                                }
                            } else {
                                if (then_v !== undefined) temp = '';
                            };
                        } else {
                            if (else_v !== undefined && else_v != '') {
                                if (if_type == 1) {
                                    temp = render(data, else_v);
                                } else {
                                    temp = my_trim(removePairedBorderQuotes(else_v));
                                }
                            } else {
                                if (else_v !== undefined) temp = '';
                            };
                        }
                    } else if ((if_type == 3) && variable[1] !== undefined) { // check bits
                        let checkWithThis = variable[1].toString();
                        let checkFor = 0;
                        let eqWithThis = true;
                        let testbit = parseInt(temp);
                        if (isNaN(testbit)) {
                            eqWithThis = false;
                        } else {
                            for (checkFor = 0; checkFor < checkWithThis.length; checkFor++) {
                                if (!eqWithThis) continue;
                                let ch = checkWithThis.charAt(checkFor);
                                if (ch != '1' && ch != '0') continue;
                                if (bit_test(testbit, checkFor)) {
                                    if (ch == '0') {
                                        eqWithThis = false;
                                        break;
                                    }
                                } else {
                                    if (ch == '1') {
                                        eqWithThis = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (eqWithThis) {
                            if (then_v !== undefined && then_v != '') {
                                if (if_type == 1) {
                                    temp = render(data, then_v);
                                } else {
                                    temp = my_trim(removePairedBorderQuotes(then_v));
                                }
                            } else {
                                if (then_v !== undefined) temp = '';
                            };
                        } else {
                            if (else_v !== undefined && else_v != '') {
                                if (if_type == 1) {
                                    temp = render(data, else_v);
                                } else {
                                    temp = my_trim(removePairedBorderQuotes(else_v));
                                }
                            } else {
                                if (else_v !== undefined) temp = '';
                            };
                        }
                    }
                    str = str_replace(j_var[0] + name_var + j_var[1], temp + '', str);
                } else {
                    debug_log('too long or short variable in ' + name + ' on ' + str.substr(ind_s, ind_e - (ind_s)));
                    ind_s = ind_s + 1;
                }
            }


            ///parse JSON arrays
            ///parse JSON arrays
            ///parse JSON arrays
            ind_s = 0;
            ind_e = 0;
            let filter = '';
            while (str.indexOf(j_loop[0], ind_s) != -1) {
                trunc_str = -1;
                limits = -1;
                if_type = -1;
                ind_s = str.indexOf(j_loop[0], ind_s);
                ind_e = str.indexOf(j_loop[1], ind_s + j_loop[0].length);
                filter = '';
                set_filter(filter);
                temp_str = '';
                if ((ind_e != -1) && ((ind_e - ind_s) < 200) && ((ind_e - ind_s) > 0)) {
                    name_template = str.substr(ind_s + j_loop[0].length, ind_e - (ind_s + j_loop[0].length));
                    temp_template = name_template.split(',');
                    temp_str = '';

                    let ttt = 2;
                    let pars_new = '';
                    for (ttt = 2; ttt < temp_template.length; ttt++) {
                        pars_new = temp_template[ttt];
                        if (pars_new.indexOf('if=') != -1) {
                            filter = pars_new;
                            set_filter(filter);
                        } else if (pars_new.indexOf('limit=') != -1) {
                            limits = parseInt(str_replace('limit=', '', str_replace('`', '', pars_new)));
                            if (limits < 1) {
                                limits = -1;
                            };
                        } else if (pars_new.indexOf('defstr=') != -1) {
                            defaultString = str_replace('defstr=', '', str_replace('`', '', pars_new));
                        } else if (pars_new.indexOf('default=') != -1) {
                            defaultTemplate = my_trim(str_replace('default=', '', str_replace('`', '', pars_new)));
                        }
                    }

                    temp_data = data;
                    name_var = temp_template[0];
                    temp_data = get_from_data(data, removePairedBorderQuotes(name_var), local_template_instance_id);
                    let k = 0;
                    let ccc = temp_data.length - 1;
                    let pagindex = 0;
                    if (ccc < 0) {
                        if (defaultString.length > 0) {
                            temp_str = temp_str + defaultString + '';
                        } else if (defaultTemplate.length > 0) {
                            temp_str = temp_str + render(temp_data, defaultTemplate) + '';
                        }
                        debug_log('No data in this array! ' + name_var);
                    };



                    let key = 0;
                    let elements_arr_length = temp_data.length;
                    let total_elem_arr = elements_arr_length;
                    for (key in temp_data) {
                        elements_arr_length--;
                        //filter
                        if ((limits > 0) && (k >= limits)) {
                            break;
                        };

                        if (!check_filter(temp_data[key])) {
                            continue;
                        };
                        //filter_end

                        if ((typeof temp_data[key] == "object")) {
                            temp_data[key]['json2html_counter'] = k + '';
                            temp_data[key]['json2html_key'] = key + '';
                            //k=parseInt(k);
                            if (k == 0) {
                                temp_data[key]['json2html_first'] = '1';
                            };
                            if (k == ccc) {
                                temp_data[key]['json2html_last'] = '1';
                            };
                            //temp_data[key]['index_0'] = 'unused';
                            //temp_data[key]['index_1'] = 'unused';
                            if (((k + 1) % 2) == 0) {
                                temp_data[key]['json2html_even'] = '1';
                            } else {
                                temp_data[key]['json2html_odd'] = '1';
                            };
                        }

                        temp_str = temp_str + render(temp_data[key], temp_template[1]);

                        k++;
                    }


                    str = str_replace(j_loop[0] + name_template + j_loop[1], temp_str, str);

                } else {
                    debug_log('too long or short Foreach{+..+} in ' + name + ' on ' + str.substr(ind_s, ind_e - (ind_s)));
                    ind_s = ind_s + 1;
                }
            }

            ///parse HTML templates
            ///parse HTML templates
            ///parse HTML templates
            ind_s = 0;
            ind_e = 0;
            while (str.indexOf(j_templ[0], ind_s) != -1) {
                trunc_str = -1;
                if_type = -1;
                ind_s = str.indexOf(j_templ[0], ind_s);
                ind_e = str.indexOf(j_templ[1], ind_s + j_templ[0].length);
                let curData = data;
                if ((ind_e != -1) && ((ind_e - ind_s) < 200) && ((ind_e - ind_s) > 0)) {
                    name_template = str.substr(ind_s + j_templ[0].length, ind_e - (ind_s + j_templ[0].length));
                    let name_template_all = name_template;
                    if (name_template.indexOf(',') != -1) {
                        name_template = name_template.split(',');
                        name_template[1] = name_template.slice(1).join(',');
                        let dataindex = removePairedBorderQuotes(my_trim(name_template[1]));
                        name_template = name_template[0];
                        if (dataindex.startsWith('{') && dataindex.endsWith('}')) {
                            try {
                                curData = JSON.parse(dataindex);
                            } catch (e) {
                                debug_log(e.name + ' - ' + dataindex);
                            }
                        } else {
                            curData = get_from_data(curData, dataindex, local_template_instance_id);
                        }
                    }
                    str = str_replace(j_templ[0] + name_template_all + j_templ[1], render(curData, name_template), str);
                } else {
                    debug_log('too long or short template{:..:} in ' + name + ' on ' + str.substr(ind_s, ind_e - (ind_s)));
                    ind_s = ind_s + 1;
                }
            }


            level_parce--;
            data_parent_array.pop();
            data_parent_index--;
            if (data_parent_index >= data_parent_array.length || data_parent_index < 0) {
                data_parent_index = data_parent_array.length - 1
            }
            if (DEBUG && (error_parcer != '') && (level_parce == 0)) {
                //debug_log('some data is left from datasource \n'+error_parcer);
                error_parcer = '';
            };
            return my_trim(str);
        }

        function executeJS(element) {
            let scripts = Array.prototype.slice.call(element.getElementsByTagName("script"));
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src != "") {
                    let dochead = document.getElementsByTagName("head")[0];
                    let url = my_trim(scripts[i].src);
                    let id = str_replace('.', '_', str_replace(':', '_', str_replace('/', '_', url)));
                    let js_exists = document.getElementById(id);
                    if (js_exists) {
                        //already was dinamically (NOT STATIC) injected
                    } else {
                        let tag = document.createElement("script");
                        tag.src = url;
                        tag.id = id;
                        dochead.appendChild(tag);
                    }
                } else {
                    eval(scripts[i].innerHTML);
                }
                scripts[i].parentElement.removeChild(scripts[i]);
            }
        }

        function inject2DOM(data, name, selector) {
            let elements = null;
            try {
                elements = document.querySelectorAll(selector);
            } catch (e) {}
            if (elements === undefined || elements == null) {
                return [];
            }
            let html = render(data, name);
            for (let i = 0; i < elements.length; ++i) {
                let element = elements[i];
                if ('innerHTML' in element) {
                    element.innerHTML = html;
                    executeJS(element);
                }
            }
            return elements;
        }

        function str_replace(search, replace, osubject) {
            if (osubject === undefined) return osubject;
            if (!String.prototype.replaceAll) {
                return osubject.split(search).join(replace);
            }
            return osubject.replaceAll(search, replace);
            //return osubject.replace(search,replace);//replaced only first simbol - can not be user here
        }

        //trim function - remove first and last spaces
        function my_trim(str) {
            if (str === undefined || str === null) {
                return '';
            };
            if (str.length < 1) return '';
            if (!String.prototype.trim) {
                return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
            }
            return str.trim();
        }

        function debug_log(s) {
            if (DEBUG) {
                console.log('Json2Html: ' + s);
            };
        }

        //for debug
        function printObject(arr, plevel) {
            let level = (typeof plevel == 'undefined') ? 1 : plevel;
            let print_red_text = "";
            if (!level) level = 0;
            let level_padding = "";
            for (let j = 0; j < level + 1; j++) level_padding += "    ";
            if (typeof(arr) == 'object') {
                for (let item in arr) {
                    let value = arr[item];
                    if (typeof(value) == 'object') {
                        print_red_text += level_padding + "'" + item + "' :\n";
                        print_red_text += printObject(value, level + 1);
                    } else
                        print_red_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
                }
            } else print_red_text = "===>" + arr + "<===(" + typeof(arr) + ")";
            return print_red_text;
        };



        function net_error(mycallback, text, error, ecode) {
            let code = (typeof ecode == 'undefined') ? 500 : ecode;
            if (DEBUG) {
                debug_log('Network: ' + text + "\n" + printObject(error));
            }
            mycallback(JSON.parse('{"error":{"state":true,"title":"Network error","message":"' + str_replace("'", '', str_replace('"', '', text)) + '","code":' + code + '}}'));
        }

        function fetchRequest(method, rtype, url, postdata, mycallback_func) {
            let mycallback = mycallback_func;
            let options = {
                mode: CORS ? 'cors' : 'same-origin', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: CORS ? 'include' : 'same-origin',
                redirect: 'follow',
            };
            let is_json_result = my_trim(rtype).toUpperCase() == 'JSON';
            if (my_trim(method).toUpperCase() == 'POST') {
                options.method = 'POST';
                options.body = JSON.stringify(postdata);
                options.headers = {
                    'Content-Type': 'application/json',
                    'Accept': is_json_result ? 'application/json' : 'text/html'
                };
            } else {
                options.method = 'GET';
                options.headers = {
                    'Accept': is_json_result ? 'application/json' : 'text/html'
                };
            }
            fetch(url, options).then(function(response) {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                if (is_json_result) {
                    return response.json();
                }
                return response.text();
            }).then(function(data) {
                mycallback(data);
            }).catch(function(error) {
                if (is_json_result) {
                    net_error(mycallback, error.message, error);
                } else {
                    if (DEBUG) {
                        debug_log(textStatus + "\n" + printObject(errorThrown));
                    }
                    alert('json2html: "' + url + '" ' + error.message);
                }
            });
        }

        function xhrRequest(method, rtype, url, postdata, mycallback_func) {
            let mycallback = mycallback_func;
            let oAjaxReq = new XMLHttpRequest();
            oAjaxReq.withCredentials = true;
            let is_json_result = my_trim(rtype).toUpperCase() == 'JSON';
            let is_post = my_trim(method).toUpperCase() == 'POST';
            if (is_post) {
                method = 'POST';
            } else {
                method = 'GET';
            }
            oAjaxReq.onload = function(evt) {
                if (oAjaxReq.readyState == 4) {
                    if (oAjaxReq.status == 200) {
                        let text = oAjaxReq.responseText;
                        if (is_json_result) {
                            try {
                                mycallback(JSON.parse(text));
                            } catch (e) {
                                net_error(mycallback, e.name, e, oAjaxReq.status);
                            }
                        } else {
                            mycallback(text);
                        }
                    } else {
                        net_error(mycallback, 'Wrong status ' + oAjaxReq.status, {
                            error: 'XMLHttpRequest',
                            status: oAjaxReq.status
                        }, oAjaxReq.status);
                    }
                }
            };
            oAjaxReq.onerror = function(evt) {
                net_error(mycallback, oAjaxReq.statusText, evt, oAjaxReq.status);
            };
            oAjaxReq.open(method, url, true);
            if (is_post) {
                oAjaxReq.setRequestHeader("Content-Type", "application/json");
                oAjaxReq.setRequestHeader("Accept", is_json_result ? 'application/json' : 'text/html');
                oAjaxReq.send(JSON.stringify(postdata));
            } else {
                oAjaxReq.setRequestHeader("Accept", is_json_result ? 'application/json' : 'text/html');
                oAjaxReq.send();
            }
        }

        function getJSON(url, mycallback_func) {
            if ('fetch' in window) {
                fetchRequest('get', 'json', url, null, mycallback_func);
            } else {
                xhrRequest('get', 'json', url, null, mycallback_func);
            }
        }

        function postJSON(url, postdata, mycallback_func) {
            if ('fetch' in window) {
                fetchRequest('post', 'json', url, postdata, mycallback_func);
                return;
            } else {
                xhrRequest('post', 'json', url, postdata, mycallback_func);
            }
        }

        let all_templates_loaded = 0;

        function lockTemplateCallback() {
            all_templates_loaded++;
        }

        function unlockTemplateCallback() {
            all_templates_loaded--;
        }

        function normalizeTags(tag, html, opentag) {
            tag = my_trim(tag);
            let replace_arr = []
            if (tag.length == 2) {
                replace_arr.push(tag.charAt(0) + ' ' + tag.charAt(1));
            } else if (tag.length == 3) {
                replace_arr.push(tag.charAt(0) + ' ' + tag.charAt(1) + tag.charAt(2));
                replace_arr.push(tag.charAt(0) + tag.charAt(1) + ' ' + tag.charAt(2));
                replace_arr.push(tag.charAt(0) + ' ' + tag.charAt(1) + ' ' + tag.charAt(2));
            } else {
                return html;
            }
            if (opentag) {
                replace_arr.push(tag + '  ');
                replace_arr.push(tag + ' ');
            } else {
                replace_arr.push('  ' + tag);
                replace_arr.push(' ' + tag);
            }
            for (let k = 0; k < replace_arr.length; k++) {
                html = str_replace(replace_arr[k], tag, html);
            }
            return html;
        }

        let inline_counter = Math.floor((Math.random() * 99) + 100);

        function getTagSubString(startIndex, fromStr, toStr, html) {
            let result = {
                'str': '',
                'start': 0,
                'end': 0,
                'var': '',
                'inline': false,
                'list': []
            }

            let start = html.indexOf(fromStr, startIndex);
            if (start == -1) return result;
            result['start'] = start;
            startIndex = start + fromStr.length;
            let end = html.indexOf(toStr, startIndex);
            if (end == -1) return result;
            if (end <= start) return result;
            if (end - start > 200) return result;
            result['end'] = end;
            result['str'] = html.substring(start + fromStr.length, end);
            let arr = result['str'].split(',');
            for (let i = 0; i < arr.length; i++) {
                arr[i] = my_trim(arr[i]);
            }
            result['var'] = arr[0];
            if (result['var'].length < 1) {
                result['inline'] = false;
                return result;
            }
            result['list'] = arr;
            if (arr.length < 2) {
                result['inline'] = true;
            } else if (arr[1].startsWith('if=') || arr[1].startsWith('limit=') || arr[1].startsWith('default=')) {
                result['inline'] = true;
            } else {
                return result;
            }
            return result;
        }

        let splitter_loop_protection = 10;

        function splitInlineLoops(html, appendTemplates) {
            splitter_loop_protection--;
            if (splitter_loop_protection < 1) {
                splitter_loop_protection++;
                return html;
            }
            let startIndex = 0
            let obj = {
                'end': 1,
                'inline': true
            }
            do {
                obj = getTagSubString(startIndex, j_loop[0], j_loop[1], html);
                if (obj['end'] > 0) {
                    startIndex = obj['end'] + j_loop[1].length;
                    if (obj['inline']) {
                        let closeTag = j_loop[0] + '/' + obj['var'] + j_loop[1];
                        let closeTagIndex = html.indexOf(closeTag, startIndex);
                        if (closeTagIndex >= startIndex) {
                            inline_counter++;
                            let inlineObjIndex = 'inline' + inline_counter;
                            let inlinehtml = my_trim(html.substring(obj['end'] + j_loop[1].length, closeTagIndex));
                            appendTemplates[inlineObjIndex] = inlinehtml;
                            startIndex = obj['start'] + 1;
                            let loopString = j_loop[0] + obj['var'] + ',' + inlineObjIndex;
                            if (obj['list'].length > 1) {
                                for (let i = 1; i < obj['list'].length; i++) {
                                    let param = obj['list'][i];
                                    if (param.length > 0) {
                                        loopString = loopString + ',' + param;
                                    }
                                }
                            }
                            loopString = loopString + j_loop[1];
                            html = html.substring(0, obj['start']) + loopString + html.substring(closeTagIndex + closeTag.length);
                            startIndex = obj['start'] + loopString.length;
                            appendTemplates[inlineObjIndex] = splitInlineLoops(appendTemplates[inlineObjIndex], appendTemplates);
                        }
                    }
                }
            } while (obj['end'] > 0)
            splitter_loop_protection++;
            return html;
        }

        function normalizeTemplates(arr) {
            for (let item in arr) {
                arr[item] = normalizeTags(j_var[0], arr[item], true);
                arr[item] = normalizeTags(j_var[1], arr[item], false);
                arr[item] = normalizeTags(j_loop[0], arr[item], true);
                arr[item] = normalizeTags(j_loop[1], arr[item], false);
                arr[item] = normalizeTags(j_templ[0], arr[item], true);
                arr[item] = normalizeTags(j_templ[1], arr[item], false);
                arr[item] = str_replace(j_loop[0] + '/  ', j_loop[0] + '/', arr[item]);
                arr[item] = str_replace(j_loop[0] + '/ ', j_loop[0] + '/', arr[item]);
                arr[item] = str_replace('` then', '`then', arr[item]);
                arr[item] = str_replace('then `', 'then`', arr[item]);
                arr[item] = str_replace('` else', '`else', arr[item]);
                arr[item] = str_replace('else `', 'else`', arr[item]);
                arr[item] = str_replace('if = `', 'if=`', arr[item]);
                arr[item] = str_replace('if= `', 'if=`', arr[item]);
                arr[item] = str_replace('if =`', 'if=`', arr[item]);
                splitter_loop_protection = 10;
                arr[item] = splitInlineLoops(arr[item], arr);
            }
            return arr;
        }

        function load_template(to_template, url, common_func) {
            if (url === undefined) {
                debug_log('Undefined URL in templates array');
                return;
            }
            all_templates_loaded++; //increace template requests counter

            if ('fetch' in window) {
                fetchRequest('get', 'text', url, null, function(data) {
                    __build_templates(data, to_template, common_func, url)
                });
                return;
            } else {
                xhrRequest('get', 'text', url, null, function(data) {
                    __build_templates(data, to_template, common_func, url)
                });
            }
        }


        function __build_templates(data, to_template, common_func, url) {
            let myParam = url.substring(url.lastIndexOf('/') + 1);
            myParam = my_trim(myParam.substring(0, myParam.lastIndexOf('.')));
            if (data.match(/^\s*?NextTemplateName:\s*?\S{1,100}\s*?$/m)) {
                debug_log('File with templates detected: ' + myParam)
                let temlArr = data.split('NextTemplateName:');
                let i = 0;
                for (i = 0; i < temlArr.length; i++) {
                    let nIndex = temlArr[i].indexOf('\n');
                    let tParam = '';
                    let tData = '';
                    if (i > 0) {
                        if (nIndex < 0 || nIndex > 100) {
                            debug_log('Strange template loaded from file ' + myParam + '. All templates should be starter with line "NextTemplateName: name_of_template"');
                            debug_log(temlArr[i]);
                            continue;
                        }
                        tParam = my_trim(temlArr[i].substring(0, nIndex));
                        tData = my_trim(temlArr[i].substring(nIndex + 1));
                    } else {
                        tData = my_trim(temlArr[i]);
                        if (tData.length == 0) {
                            debug_log('thete is nothing in first "' + myParam + '" of the content ' + i);
                            continue;
                        }
                        tParam = myParam;
                    }

                    if (tData.length == 0) {
                        debug_log('thete is nothing in one of the content ' + i);
                        continue;
                    }
                    if (tParam.length == 0) {
                        debug_log('thete is no title in one of the templates ' + i);
                        tParam = myParam;
                    }
                    to_template[tParam] = tData;
                    debug_log('Loaded template ' + tParam + ' from file ' + myParam);
                }
            } else {
                to_template[myParam] = data;
                debug_log('Loaded file ' + myParam);
            }

            all_templates_loaded--; //decrease template requests counter
            if (all_templates_loaded == 0) common_func(); //sending inital requests
        }



        function __updatejsonformat(obj, o) {
            let n = o.name,
                v = o.value;
            if ((/\[.*?\]/).test(n)) {
                let firstN = n.split('[')[0];
                let indexes = n.match(/\[.*?\]/g);
                let c = indexes.length;
                let numerisArraFinal = n.indexOf('[]') != -1;
                if (obj[firstN] === undefined) {
                    if (c == 1 && numerisArraFinal) {
                        obj[firstN] = new Array();
                    } else {
                        obj[firstN] = {};
                    }
                }
                let i = 0;
                let curObj = obj[firstN];
                for (i = 0; i < c; i++) {
                    let index = str_replace('[', '', str_replace(']', '', indexes[i]));
                    if (i == c - 1) {
                        if (index == '') {
                            if (Array.isArray(curObj)) {
                                curObj.push(v)
                            }
                        } else {
                            curObj[index] = v;
                        }
                    } else {
                        if (curObj[index] === undefined) {
                            if ((i == (c - 2)) && numerisArraFinal) {
                                curObj[index] = new Array();
                            } else {
                                curObj[index] = {};
                            }
                        }
                        curObj = curObj[index]
                    }
                }
            } else if (obj[n] === undefined) {
                obj[n] = v;
            }
        }

        function serializeHtmlForm(selector) {
            let form = document.querySelector(selector);
            if (form === undefined || form == null) {
                return {};
            }
            return serializeDOM(form);
        }

        function serializeDOM(form) {
            let obj = {};
            let elements = form.querySelectorAll("input, select, textarea");
            for (let i = 0; i < elements.length; ++i) {
                let element = elements[i];
                let name = element.name;

                if (name) {
                    let value = element.value;
                    if (element.tagName.toUpperCase() == 'INPUT' && element.type.toUpperCase() == 'CHECKBOX') {
                        if (!element.checked) {
                            value = value + '__false';
                        }
                    }
                    __updatejsonformat(obj, {
                        name: name,
                        value: value
                    });
                }
            }
            return obj;
        }

        //add new function to JQuerry object if it exists
        if (jQuery !== undefined) {
            try {
                jQuery.fn.serializeHtmlForm = function() {
                    return serializeDOM(this[0])
                };
                jQuery.fn.injectJSON = function(data, template) {
                    let html = render(data, template);
                    this.each(function() {
                        jQuery(this).html(html);
                        executeJS(jQuery(this)[0]);
                    });
                    return this;
                }
            } catch (e) {}
        }

        function isAllTemplatesLoaded() {
            return all_templates_loaded < 1;
        }


        let templates_callback_function = 0;
        let shadow_templates_object = {};

        function shadow_templates_callback() {
            if (!isAllTemplatesLoaded()) return false;
            normalizeTemplates(shadow_templates_object);
            translate(shadow_templates_object);
            templates_callback_function();
        }

        function loadTemplatesArray(arr, func, treset) {
            let reset = (typeof treset == 'undefined') ? true : treset;
            if (!isAllTemplatesLoaded()) {
                alert('Critical error.\nTrying to load templates before previous templates request is completed');
            }
            let i = 0;
            if (reset) {
                shadow_templates_object = {};
            }
            templates_callback_function = func;
            lockTemplateCallback();
            for (i = 0; i < arr.length; i++) {
                load_template(shadow_templates_object, arr[i], shadow_templates_callback);
            }
            unlockTemplateCallback();
            shadow_templates_callback();
        }

        /**
         * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
         *
         * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
         * @see http://github.com/garycourt/murmurhash-js
         * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
         * @see http://sites.google.com/site/murmurhash/
         *
         * @param {string} key ASCII only
         * @param {number} seed Positive integer only
         * @return {number} 32-bit positive integer hash
         */

        const murmurSeed = Math.round(((Math.random() * 10000) + 10000));

        function murmurhash3_32_gc(key) {
            let seed = murmurSeed;
            let remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

            remainder = key.length & 3; // key.length % 4
            bytes = key.length - remainder;
            h1 = seed;
            c1 = 0xcc9e2d51;
            c2 = 0x1b873593;
            i = 0;

            while (i < bytes) {
                k1 =
                    ((key.charCodeAt(i) & 0xff)) |
                    ((key.charCodeAt(++i) & 0xff) << 8) |
                    ((key.charCodeAt(++i) & 0xff) << 16) |
                    ((key.charCodeAt(++i) & 0xff) << 24);
                ++i;

                k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
                k1 = (k1 << 15) | (k1 >>> 17);
                k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

                h1 ^= k1;
                h1 = (h1 << 13) | (h1 >>> 19);
                h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
                h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
            }

            k1 = 0;

            switch (remainder) {
                case 3:
                    k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
                case 2:
                    k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
                case 1:
                    k1 ^= (key.charCodeAt(i) & 0xff);

                    k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
                    k1 = (k1 << 15) | (k1 >>> 17);
                    k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
                    h1 ^= k1;
            }

            h1 ^= key.length;

            h1 ^= h1 >>> 16;
            h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= h1 >>> 13;
            h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
            h1 ^= h1 >>> 16;

            return h1 >>> 0;
        }


        let translate_level = 10;

        function translate(obj, tkeys) {
            let keys = (typeof tkeys == 'undefined') ? [] : tkeys;
            if (obj === undefined) return '';
            if (obj === null || Number.isInteger(obj)) return obj;
            if ((translation_strings === undefined) || (translation_strings === null) || (!(typeof translation_strings == "object"))) return obj;
            if (typeof obj === 'string') {
                return translateString(obj);
            }
            translate_level--;
            if (translate_level < 0) {
                translate_level++;
                alert('Stackoverflow protection triggered');
                translate_level = 10;
                return obj;
            }

            let customKeys = false;
            if (Array.isArray(keys) && (keys.length > 0)) {
                customKeys = true;
            }
            for (let key in obj) {
                if (obj[key] === undefined || obj[key] === null || Number.isInteger(obj[key])) continue;
                if (Array.isArray(obj[key]) || (typeof obj[key]) == 'object') {
                    translate(obj[key], keys)
                } else if (typeof obj[key] === 'string' || obj[key] instanceof String) {
                    if (customKeys) {
                        if (in_array(keys, key, true)) {
                            obj[key] = translateString(obj[key]);
                        }
                    } else {
                        obj[key] = translateString(obj[key]);
                    }
                }
            }
            translate_level++;
            return obj;
        }

        function checkInSimbolRange(ch) {
            if (((48 <= ch) && (ch <= 57)) || ((65 <= ch) && (ch <= 90)) || ((97 <= ch) && (ch <= 122)) || (ch == 95)) {
                return true;
            }
            return false
        }

        function minStopSimbol(index, str) {
            let i = 0;
            let ch = 0;
            let temp = -1;
            let len = str.length;
            for (i = 0; i < 41; i++) {
                temp = index + i;
                if (temp >= len) return len;
                ch = str.charCodeAt(temp);
                if (!checkInSimbolRange(ch)) {
                    return temp;
                }
            }
            return temp;
        }

        /* json object direct echo to JavaScript */
        let translation_strings = null;

        function setTranslationArray(jsonObject) {
            if (jsonObject === undefined) {
                console.log('Translation array is undefined');
                return;
            }
            translation_strings = jsonObject;
            if (Object.keys(translation_strings).length == 0) {
                translation_strings = null;
            }
        }


        function translateString(str) {
            if (str === undefined) return '';
            if ((translation_strings === undefined) || (translation_strings === null) || (!(typeof translation_strings == "object"))) return str;
            let indexEnd = -1;
            let movedIndex = -1;
            let prefix_length = translate_prefix.length;
            let checklen = str.length - (prefix_length + 2);
            if (checklen < 0) return str;
            let key = '';
            let keyLen = 0;
            let index = str.indexOf(translate_prefix);
            let counter_protector = 300;
            while (index != -1) {
                counter_protector--;
                if (counter_protector < 0) {
                    alert('Loop protection: JS template library');
                    return str;
                }
                movedIndex = index + prefix_length;
                indexEnd = minStopSimbol(movedIndex, str);
                keyLen = indexEnd - movedIndex;
                if (keyLen > 2 || keyLen < 40) {
                    key = str.substr(movedIndex, keyLen);
                    if (translation_strings[key] !== undefined) {
                        str = str.replace(translate_prefix + key, translation_strings[key])
                        index = str.indexOf(translate_prefix, index + 1);
                    } else {
                        console.log('No translation for key: "' + key + '"');
                        index = str.indexOf(translate_prefix, indexEnd);
                    }
                } else {
                    index = str.indexOf(translate_prefix, indexEnd);
                }
            }
            return str
        }

        function setDebug(isDebug) {
            DEBUG = isDebug;
        }

        return {
            render: render, //parse loaded templates with JSON response from server - look documentation
            inject2DOM: inject2DOM, //parse loaded templates with JSON response from server - look documentation
            getJSON: getJSON, //send GET request with calback
            postJSON: postJSON, //send POST request  with calback
            loadTemplatesArray: loadTemplatesArray, //load multi-files templates with callback after all files loaded successfully
            setTranslationArray: setTranslationArray, // set translation array with keys as part of "@str.key" in strings without prefix "@str."
            translate: translate, //if you need to translate JSON object manually. All templates are translated automatically
            executeJS: executeJS, //run injected code inside components.
            printObject: printObject, //for debug to see contend of object. you can use "vardump" keyword - data.vardump. If you want to see content in HTML
            setDebug: setDebug, //for console output of all library warnings and errors
            serializeHtmlForm: serializeHtmlForm //extend JQuery.serializeArray() with unchecked checkboxes and arrays. You can use JQuery.serializeHtmlForm()
        }
    }());
    var jth = json2html; //alternative name
}