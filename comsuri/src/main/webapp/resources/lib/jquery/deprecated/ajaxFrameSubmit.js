
jQuery.extend({
    createFrameForm: function(id, fileElementId, data, frameId, url)
	{
		//create form	
		var formId = 'jUploadForm' + id;
		var fileId = 'jUploadFile' + id;
		var form = jQuery('<form  action="'+url+'" target="'+frameId+'" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');	
		if(data)
		{
			for(var i in data)
			{
				jQuery('<input type="hidden" name="' + i + '" value="' + data[i] + '" />').appendTo(form);
			}			
		}		
		/*
		var oldElement = jQuery('#' + fileElementId);
		var newElement = jQuery(oldElement).clone();
		jQuery(oldElement).attr('id', fileId);
		jQuery(oldElement).before(newElement);
		jQuery(oldElement).appendTo(form);
*/

		
		//set attributes
		jQuery(form).css('position', 'absolute');
		jQuery(form).css('top', '-1200px');
		jQuery(form).css('left', '-1200px');
		jQuery(form).appendTo('body');		
		return form;
    },

    frameSubmit: function(s) {
        // TODO introduce global settings, allowing the client to modify them for all requests, not only timeout		
        var id = new Date().getTime();        
		var form = jQuery.createFrameForm(id, s.fileElementId, (typeof(s.data)=='undefined'?false:s.data),s.frameId, s.url);
		var io = jQuery('#' + s.frameId).get(0);
		var frameId = s.frameId;
		var formId = 'jUploadForm' + id;		
      
        // Wait for a response to come back
        var uploadCallback = function(isTimeout)
		{			
			var io = document.getElementById(frameId);
			var data = null;
            try 
			{				
				if(io.contentWindow)
				{
					//console.debug(io.contentWindow.document.body)
					 data = io.contentWindow.document.body?io.contentWindow.document.body.innerHTML:null;
					 
				}else if(io.contentDocument)
				{
					data = io.contentDocument.document.body?io.contentDocument.document.body.innerHTML:null;
				}
            }catch(e)
			{
				console.debug(e);//jQuery.handleError(s, xml, null, e);
			}
            
         // process the data (runs the xml through httpData regardless of callback)
            //var data = jQuery.uploadHttpData( data, s.dataType );    
            // If a local callback was specified, fire it and pass it the data
            if ( s.success )
                s.success( data, status );                        
        };
        
        jQuery('#' + frameId).load(uploadCallback);
        
        form.submit();
        return {abort: function () {}};	
    },

    uploadHttpData: function( r, type ) {
        var data = !type;
        data = type == "xml" || data ? r.responseXML : r.responseText;
        // If the type is "script", eval it in global context
        if ( type == "script" )
            jQuery.globalEval( data );
        // Get the JavaScript object, if JSON is used.
        if ( type == "json" )
            eval( "data = " + data );
        // evaluate scripts within html
        if ( type == "html" )
            jQuery("<div>").html(data).evalScripts();

        return data;
    }
})

