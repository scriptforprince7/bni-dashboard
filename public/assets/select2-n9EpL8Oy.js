(function(){$(".js-example-basic-single").select2(),$(".js-example-basic-multiple").select2(),$(".js-example-placeholder-single").select2({placeholder:"Select a state",allowClear:!0}),$(".js-example-placeholder-multiple").select2({placeholder:"Select a state"});function s(e){if(!e.id)return e.text;var t="http://127.0.0.1:5500/ assets/images/faces/select2",l=$('<span><img src="'+t+"/"+e.element.value.toLowerCase()+'.jpg" class="img-flag" > '+e.text+"</span>");return l}$(".js-example-templating").select2({templateResult:s,templateSelection:s,placeholder:"Choose Customer"});function r(e){if(!e.id)return e.text;var t=$('<span><img src="http://127.0.0.1:5500/ assets/images/faces/select2/'+e.element.value.toLowerCase()+'.jpg" /> '+e.text+"</span>");return t}$(".select2-client-search").select2({templateResult:r,templateSelection:r,placeholder:"Choose Client",escapeMarkup:function(e){return e}}),$(".js-example-basic-multiple-limit-max").select2({maximumSelectionLength:3,placeholder:"Choose Person"}),$(".js-example-disabled").select2(),$(".js-example-disabled-multi").select2(),$(".js-programmatic-enable").on("click",function(){$(".js-example-disabled").prop("disabled",!1),$(".js-example-disabled-multi").prop("disabled",!1)}),$(".js-programmatic-disable").on("click",function(){$(".js-example-disabled").prop("disabled",!0),$(".js-example-disabled-multi").prop("disabled",!0)}),document.querySelector("#switcher-rtl").addEventListener("click",()=>{$(".js-example-basic-single").select2(),$(".js-example-placeholder-single").select2({placeholder:"Select a state",allowClear:!0,dir:"rtl"}),$(".js-example-basic-single").select2({dir:"rtl"}),$(".js-example-basic-multiple").select2({dir:"rtl"}),$(".js-example-placeholder-single").select2({placeholder:"Select a state",allowClear:!0,dir:"rtl"}),$(".js-example-placeholder-multiple").select2({placeholder:"Select a state",dir:"rtl"});function e(l){if(!l.id)return l.text;var a="http://127.0.0.1:5500/ assets/images/faces/select2",i=$('<span><img src="'+a+"/"+l.element.value.toLowerCase()+'.jpg" class="img-flag" /> '+l.text+"</span>");return i}$(".js-example-templating").select2({templateResult:e,placeholder:"Choose Customer",dir:"rtl"});function t(l){if(!l.id)return l.text;var a=$('<span><img src="http://127.0.0.1:5500/ assets/images/faces/select2/'+l.element.value.toLowerCase()+'.jpg" /> '+l.text+"</span>");return a}$(".select2-client-search").select2({templateResult:t,templateSelection:t,placeholder:"Choose Client",dir:"rtl",escapeMarkup:function(l){return l}}),$(".js-example-basic-multiple-limit-max").select2({maximumSelectionLength:3,placeholder:"Choose Person",dir:"rtl"}),$(".js-example-disabled").select2({dir:"rtl"}),$(".js-example-disabled-multi").select2({dir:"rtl"}),$(".js-programmatic-enable").on("click",function(){$(".js-example-disabled").prop("disabled",!1),$(".js-example-disabled-multi").prop("disabled",!1)}),$(".js-programmatic-disable").on("click",function(){$(".js-example-disabled").prop("disabled",!0),$(".js-example-disabled-multi").prop("disabled",!0)})}),document.querySelector("#switcher-ltr").addEventListener("click",()=>{$(".js-example-placeholder-single").select2({placeholder:"Select a state",allowClear:!0,dir:"ltr"}),$(".js-example-basic-multiple").select2({dir:"ltr"}),$(".js-example-basic-single").select2({dir:"ltr"}),$(".js-example-placeholder-multiple").select2({placeholder:"Select a state",dir:"ltr"}),$(".js-example-templating").select2({dir:"ltr"}),$(".select2-client-search").select2({dir:"ltr"}),$(".js-example-basic-multiple-limit-max").select2({maximumSelectionLength:3,placeholder:"Choose Person",dir:"ltr"}),$(".js-example-disabled").select2({dir:"ltr"}),$(".js-example-disabled-multi").select2({dir:"ltr"})})})();
