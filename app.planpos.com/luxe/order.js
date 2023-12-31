"use strict";
var items = [];
var currentItem = null;
var currentItemSelectedPrice = null;
var lastAdded = null;
var previouslySelected = [];
var extrasSelected = [];
var variantID = null;
var debug = true;

function debugMe(title, message) {
    if (debug) {
        console.log("#" + title);
        console.log(message);
        console.log("--------");
    }
}

/*
 * Price formater
 * @param {Nummber} price
 */
function formatPrice(price) {
    var locale = LOCALE;
    if (CASHIER_CURRENCY.toUpperCase() == "USD") {
        locale = locale + "-US";
    }

    var formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: CASHIER_CURRENCY,
    });

    var formated = formatter.format(price);

    return formated;
}

/**
 * Load extras for variant
 * @param {Number} variant_id the variant id
 * */
function loadExtras(variant_id) {
    //alert("Load extras for "+variant_id);
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    $.ajax({
        type: 'GET',
        url: '/items/variants/' + variant_id + '/extras',
        success: function(response) {
            if (response.status) {
                response.data.forEach(element => {

                    // $('#exrtas-area-inside').append('<div class="custom-control custom-checkbox mb-3"><input onclick="recalculatePrice(' + element.item_id + ');" class="custom-control-input" id="' + element.id + '" name="extra"  value="' + element.price + '" type="checkbox"><label class="custom-control-label" for="' + element.id + '">' + element.name + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+' + formatPrice(element.price) + '</label></div>');
                    $('#exrtas-area-inside').append('<label class="container_check">' + element.name + '<span>+&nbsp;' + formatPrice(element.price) + '</span><input onclick="recalculatePrice(' + element.item_id + ');" class="" for="' + element.id + '" id="' + element.id + '" name="extra"  value="' + element.price + '" type="checkbox"><span class="checkmark"></span></label>');
                });
                $('#exrtas-area').show();

            }
        },
        error: function(response) {
            //return callback(false, response.responseJSON.errMsg);
        }
    })
}




/**
 *
 * Set the selected variant, set price and shows qty area and calls load extras
 * */
function setSelectedVariant(element) {

    //console.log(formated);
    $('#modalPrice').html(formatPrice(element.price));

    //Set current item price
    currentItemSelectedPrice = element.price;

    //Show QTY
    $('.modal-footer').show();

    //Set variantID
    variantID = element.id;

    //Empty the extras, and call it
    $('#exrtas-area-inside').empty();
    loadExtras(variantID);

}

function getTheDataForTheFoundVariable() {
    console.log(previouslySelected);
    var comparableObject = {};
    previouslySelected.forEach(element => {
        comparableObject[element.option_id] = element.name.trim().toLowerCase().replace(/\s/g, "-");
    });
    comparableObject = JSON.stringify(comparableObject)
        //console.log("Comparable");
        //console.log(comparableObject);
    currentItem['variants'].forEach(element => {
        //console.log("Compare to");
        //console.log(JSON.stringify(JSON.parse(element.options)));
        if (comparableObject == JSON.stringify(JSON.parse(element.options))) {
            //console.log("This are the options");
            //console.log(element.options);
            //console.log(element.optionsiconv);
            setSelectedVariant(element);
        }
    });

}


function checkIfVariableExists(forOption, optionValue) {

    var newElement = { "option_id": forOption, "name": optionValue };
    //console.log('NEW ELEMNGT');
    //console.log(newElement);

    var possibleSelection = JSON.parse(JSON.stringify(previouslySelected));
    possibleSelection.push(newElement);
    //console.log(possibleSelection);

    var filteredObjects = [];
    //possibleSelection.forEach(element => {
    currentItem.variants.forEach(theVariant => {
        var theOptions = JSON.parse(theVariant.optionsiconv ? theVariant.optionsiconv : theVariant.options);
        var ok = true;
        Object.keys(theOptions).map((key) => {

            //console.log(key+" : "+theOptions[key])
            possibleSelection.forEach(element => {
                if (key == element.option_id) {
                    if (theOptions[key] + "" != element.name.trim().toLowerCase().replace(/\s/g, "-") + "") {
                        ok = false;
                    }
                }
            });

        })

        if (ok) {
            filteredObjects.push(theVariant);
            //console.log("ok")
        } else {
            //console.log("not ok")
        }

        //comparableObject[element.option_id]=element.name.trim().toLowerCase().replace(/\s/g , "-");
    });

    //});


    return filteredObjects.length > 0;

}

function appendOption(name, id) {
    lastAdded = id;
    $('#variants-area-inside').append('<div id="variants-area-' + id + '" class="variants-area-label"><h5 class="label-variants">' + name + '</h5><div><div id="variants-area-inside-' + id + '" class="flex-wrap btn-group btn-group-toggle" data-toggle="buttons"> </div></div>');
}

function optionChanged(option_id, name) {

    var newElement = { "option_id": option_id, "name": name };
    debugMe("selected option", JSON.stringify(newElement));


    //Append / insert the new selectioin
    var newSelectionState = [];
    var userClickedOnAlreadySelectedOption = false;
    previouslySelected.forEach(element => {

        if (userClickedOnAlreadySelectedOption) {
            $("#variants-area-" + element.option_id).remove();
        }

        if (element.option_id != newElement.option_id) {
            //If we haven't yet found the item add this in the selection
            if (!userClickedOnAlreadySelectedOption) { newSelectionState.push(element); }
        } else {
            userClickedOnAlreadySelectedOption = true;
        }


    });



    if (userClickedOnAlreadySelectedOption && lastAdded != newElement.option_id) {
        //remove also last inserted, and readded it
        $("#variants-area-" + lastAdded).remove();
    }

    newSelectionState.push(newElement);
    previouslySelected = newSelectionState;
    debugMe("Selection", JSON.stringify(previouslySelected));
    setVariants();


}

function appendOptionValue(name, value, enabled, option_id) {
    $('#variants-area-inside-' + option_id).append('<label style="opacity: ' + (enabled ? 1 : 0.5) + '" class="btn btn-outline-primary mb-2"><input  onchange="optionChanged(' + option_id + ',\'' + value + '\')"  ' + (enabled ? "" : "disabled") + ' type="radio" name="option_' + option_id + '" value="option_' + option_id + "_" + name + '" autocomplete="off" />' + js.trans(name) + '</label>')
}

function setVariants() {
    //1. Determine previously selected variants
    // var previouslySelected=[];

    //HIDE QTY
    $('.modal-footer').hide();

    $('#exrtas-area-inside').empty();
    $('#exrtas-area').hide();

    //2. Get the new option to show
    var newOptionToShow = null;
    debugMe("previouslySelected length", previouslySelected.length);
    newOptionToShow = currentItem.options[previouslySelected.length];
    debugMe("newOptionToShow", JSON.stringify(newOptionToShow));

    if (newOptionToShow != undefined) {
        //2.1 Add the options in the table
        appendOption(newOptionToShow.name, newOptionToShow.id);


        var values = (newOptionToShow.optionsiconv ? newOptionToShow.optionsiconv : newOptionToShow.options).split(",");
        var titles = (newOptionToShow.options).split(",");

        for (let index = 0; index < values.length; index++) {
            const theValue = values[index];
            const theTitle = titles[index];

            if (checkIfVariableExists(newOptionToShow.id, theValue)) {
                //Next variable exists
                //console.log("Exists: "+theValue);
                appendOptionValue(theTitle, theValue, true, newOptionToShow.id);
            } else {
                //Varaiable with the next option value doens't exists
                //console.log("Does not exists: "+theValue);
                appendOptionValue(theTitle, theValue, false, newOptionToShow.id);
            }

        }

    } else {
        console.log("No more options");
        getTheDataForTheFoundVariable();
    }




    //3. Add the new option options
    //3.1 If new option is null, show the variant price
}


function setCurrentItem(id) {


    var item = items[id];
    currentItem = item;
    previouslySelected = [];
    $('#modalTitle').text(item.name);
    $('#modalName').text(item.name);
    $('#modalPrice').html(item.price);
    $('#modalTotalPrice').html(item.price);
    $('#modalID').text(item.id);
    $('#quantity').val(1);

    if (item.image != "../default/restaurant_large.jpg") {
        $("#modalImg").attr("src", item.image);
        $("#modalDialogItem").addClass("modal-lg");
        $("#modalImgPart").show();

        $("#modalItemDetailsPart").removeClass("col-sm-6 col-md-6 col-lg-6 offset-3");
        $("#modalItemDetailsPart").addClass("col-sm col-md col-lg");
    } else {
        $("#modalImgPart").hide();
        $("#modalItemDetailsPart").removeClass("col-sm col-md col-lg");
        $("#modalItemDetailsPart").addClass("col-sm-6 col-md-6 col-lg-6 offset-3");

        $("#modalDialogItem").removeClass("modal-lg");
        $("#modalDialogItem").addClass("col-sm-6 col-md-6 col-lg-6 offset-3");
    }

    $('#modalDescription').html(item.description);


    if (item.has_variants) {
        //Vith variants
        //Hide the counter, and extrasts
        $('.modal-footer').hide();

        //Now show the variants options
        $('#variants-area-inside').empty();
        $('#variants-area').show();

        setVariants();
        //$('#modalPrice').html("dynamic");




    } else {
        //Normal
        currentItemSelectedPrice = item.priceNotFormated;
        $('#variants-area').hide();
        $('.modal-footer').show();

    }


    $('#productModal').modal('show');

    extrasSelected = [];

    variantID = null;

    //Now set the extrast
    if (item.extras.length == 0 || item.has_variants) {
        console.log('has no extras');
        $('#exrtas-area-inside').empty();
        $('#exrtas-area').hide();
    } else {
        console.log('has extras');
        $('#exrtas-area-inside').empty();
        item.extras.forEach(element => {
            console.log(element);
            $('#exrtas-area-inside').append('<label class="container_check">' + element.name + '<span>+&nbsp;' + element.priceFormated + '</span><input onclick="recalculatePrice(' + id + ');" class="" id="' + element.id + '" name="extra"  value="' + element.price + '" type="checkbox"><span class="checkmark"></span></label>');
        });
        $('#exrtas-area').show();
    }
}

function recalculatePrice(id, value) {
    //console.log("Triger price recalculation: "+id);
    // console.log(items[id]);
    var mainPrice = parseFloat(currentItemSelectedPrice);
    extrasSelected = [];

    //Get the selected check boxes
    $.each($("input[name='extra']:checked"), function() {
        mainPrice += parseFloat(($(this).val() + ""));
        extrasSelected.push($(this).attr('id'));
    });
    $('#modalPrice').html(formatPrice(mainPrice));

}

function getLocation(callback) {
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    $.ajax({
        type: 'GET',
        url: '/get/rlocation/' + $('#rid').val(),
        success: function(response) {
            if (response.status) {
                return callback(true, response.data)
            }
        },
        error: function(response) {
            return callback(false, response.responseJSON.errMsg);
        }
    })
}

function initializeMap(lat, lng) {
    var map_options = {
        zoom: 13,
        center: new google.maps.LatLng(lat, lng),
        mapTypeId: "terrain",
        scaleControl: true
    }

    map_location = new google.maps.Map(document.getElementById("map3"), map_options);
}

function initializeMarker(lat, lng) {
    var markerData = new google.maps.LatLng(lat, lng);
    marker = new google.maps.Marker({
        position: markerData,
        map: map_location,
        icon: start
    });
}

var start = "../../cdn1.iconfinder.com/data/icons/Map-Markers-Icons-Demo-PNG/48/162973.png"
var area = "../../cdn1.iconfinder.com/data/icons/Map-Markers-Icons-Demo-PNG/48/162945.png"
var map_location = null;
var map_area = null;
var marker = null;
var infoWindow = null;
var lat = null;
var lng = null;
var circle = null;
var isClosed = false;
var poly = null;
var markers = [];
var markerArea = null;
var markerIndex = null;
var path = null;

window.onload ? window.onload() : null;

window.onload = function() {
    //var map, infoWindow, marker, lng, lat;

    getLocation(function(isFetched, currPost) {
        if (isFetched) {


            if (currPost.lat != 0 && currPost.lng != 0) {
                //initialize map
                initializeMap(currPost.lat, currPost.lng)

                //initialize marker
                initializeMarker(currPost.lat, currPost.lng)

                //var isClosed = false;
            }
        }
    });
}





$(".nav-item-category").on('click', function() {
    $.each(categories, function(index, value) {
        $("." + value).show();

        //$("#nav_"+value).removeClass("active");
    });

    var id = $(this).attr("id");
    var category_id = id.substr(id.indexOf("_") + 1, id.length);
    //$("#nav_"+category_id).addClass("active");

    //$("."+category_id).hide();

    $.each(categories, function(index, value) {
        if (value != category_id) {
            $("." + value).hide();
        }
    });
});