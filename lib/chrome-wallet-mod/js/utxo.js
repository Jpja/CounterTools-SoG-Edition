
function ajax(url, data, rawtx) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            console.log(xhr.responseText);
            
            var checksuccess = jQuery.parseJSON(xhr.responseText);
            
            console.log(checksuccess.status);
            
            if (checksuccess.status != "success") {
                
                $("#sendtokenbutton").html("Refresh to continue...");
                
                $("#freezeUnconfirmed").css("display", "block");
                $("#mainDisplay").css("display", "none");
                //$("#yourtxid").html("<a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a>");
                $("#yourtxid").html("Transaction Failed!");
                $("#txsendstatus").html("Something is wrong, please try again later");
                $(".tipsendcomplete").html("<div class='h1' style='padding: 60px 0 30px 0;'>Transaction Failed!</div><div class='h4'>Something is wrong, please try again later.</div></div>");
                
            } else {
            
                $("#sendtokenbutton").html("Sent! Refresh to continue...");
                //$("#sendtokenbutton").prop('disabled', true);

                var newTxid = rawtotxid(rawtx);

                console.log(newTxid);
                $("#freezeUnconfirmed").css("display", "block");
                $("#mainDisplay").css("display", "none");
                //$("#yourtxid").html("<a href='https://blockchain.info/tx/"+newTxid+"'>View Transaction</a>");
                $("#yourtxid").html("<a href='https://chain.so/tx/BTC/"+newTxid+"'>View Transaction</a>");
                $("#txsendstatus").html("Balance will update after one confirmation");
                $(".tipsendcomplete").html("<div class='h1' style='padding: 60px 0 30px 0;'>Send Complete!</div><div class='h4'>Token balances update in wallet after one confirmation</div><hr><div class='h2'><a href='https://chain.so/tx/BTC/"+newTxid+"'>View Transaction</a></div>");
                
            }
            
            xhr.close;
        }
    }
    xhr.open(data ? "POST" : "GET", url, true);
    if (data) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}


function sendBTCpush(hextx) {
	sendBTCpush_chainso(hextx);
	sendBTCpush_blockchaininfo(hextx);
	sendBTCpush_blockr(hextx);
}
function sendBTCpush_chainso(hextx) {
    url = 'https://chain.so/api/v2/send_tx/BTC';
    postdata = 'tx_hex=' + hextx; 
    if (url != null && url != "")
    {
        ajax(url, postdata, hextx);
    }
}
function sendBTCpush_blockchaininfo(hextx) {
	url = 'http://blockchain.info/pushtx';
	postdata = 'tx=' + hextx;
    if (url != null && url != "")
    {
        ajax(url, postdata, hextx);
    }
}
function sendBTCpush_blockr(hextx) {
	url = 'http://btc.blockr.io/api/v1/tx/push';
	postdata = 'hex=' + hextx;
	if (url != null && url != "")
	{
		ajax(url, postdata);
	}
}


//SEND BITCOIN
//Several changes to the original code adds stability (several APIs, only one needs to work).
//Downside is that it takes several seconds.
//Recommended to have div 'sendfeedback' for feedback in HTML document.
var sendBtcOK = 0;
var sendBtcStatus = "";
var sendBtcTimeouts = [];
function sendBTC(add_from, add_to, sendtotal, transfee, mnemonic, feedbackdiv) {
	hex_byte();    
	bitcore = require('bitcore');
	if (typeof(feedbackdiv)==='undefined') feedbackdiv = "sendfeedback";
	sendBtcOK = 0;
	var d = new Date();
	sendBtcStatus = "<span style=\"font-size:80%;color:grey;\">" + d.toLocaleTimeString() + " - <i>Send to " + addressReadable(add_to) + "</i></span><br>";
	
	//Error tests
	if (getBalance(add_from,'BTC') < sendtotal+transfee) {
		document.getElementById(feedbackdiv).innerHTML = "<span style=\"color:DarkRed;font-weight:bold;\">CANNOT SEND</span><br />BTC balance is too low.";
		return;
	} 
	if (transfee > 0.002) { //a hardcoded test to prevent accidentally high BTC fee (today ~$0.80)
		document.getElementById(feedbackdiv).innerHTML = "<span style=\"color:DarkRed;font-weight:bold;\">CANNOT SEND</span><br />BTC fee is "+transfee.toFixed(8)+" and that's too high, right?";
		return;
	}
	
	sendBtcStatus += "Sending...";
	document.getElementById(feedbackdiv).innerHTML = sendBtcStatus;
	sendBtcTimeouts.push(setTimeout(prepareSendBTC_bitpay, 1, add_from, add_to, sendtotal, transfee, mnemonic, feedbackdiv));
	sendBtcTimeouts.push(setTimeout(prepareSendBTC_blockchaininfo, 2000, add_from, add_to, sendtotal, transfee, mnemonic, feedbackdiv));
	sendBtcTimeouts.push(setTimeout(writeSendBtcStatus, 4000, feedbackdiv));        
}

function prepareSendBTC_bitpay(add_from, add_to, sendtotal, transfee, mnemonic, feedbackdiv) {
	if (sendBtcOK != 1) { 
		sendBtcStatus += "<br>Trying Bitpay API"; 
		sendBTC_bitpay(add_from, add_to, sendtotal, transfee, mnemonic);
		document.getElementById(feedbackdiv).innerHTML = sendBtcStatus;
	} else {
		writeSendBtcStatus(feedbackdiv);
	}
}
function prepareSendBTC_blockchaininfo(add_from, add_to, sendtotal, transfee, mnemonic, feedbackdiv) {
	if (sendBtcOK != 1) { 
		sendBtcStatus += "<br>Trying Blockchain.info API"; 
		sendBTC_blockchaininfo(add_from, add_to, sendtotal, transfee, mnemonic);
		document.getElementById(feedbackdiv).innerHTML = sendBtcStatus;
	} else {
		writeSendBtcStatus(feedbackdiv);
	}
}
function writeSendBtcStatus(feedbackdiv) {
	for (var i=0; i<sendBtcTimeouts.length; i++) {
		clearTimeout(sendBtcTimeouts[i]);
	}
	if (sendBtcOK == 0) 	{ 
		sendBtcStatus += "<br><span style=\"color:DarkRed ;font-weight:bold;\">SEND FAILED</span><br />Either fail across all APIs, no Internet connection, or insufficient BTC."; 
	}
	else {
		sendBtcStatus += "<br><span style=\"color:DarkGreen;font-weight:bold;\">SEND SUCCESSFUL</span>"; 
	}
	document.getElementById(feedbackdiv).innerHTML = sendBtcStatus;  
}

function sendBTC_bitpay(add_from, add_to, sendtotal, transfee, mnemonic) {
    
    var source_html = "https://insight.bitpay.com/api/addr/"+add_from+"/utxo";     
    //var source_html = "https://chain.localbitcoins.com/api/addr/"+add_from+"/utxo";
    
    
    //var source_html = "http://btc.blockr.io/api/v1/address/unspent/"+add_from;
    
    var total_utxo = new Array();   
    var sendtotal_satoshis = parseFloat(sendtotal).toFixed(8) * 100000000;   
    //sendtotal_satoshis.toFixed(0);
    
    console.log(sendtotal_satoshis);
    sendtotal_satoshis = Math.round(sendtotal_satoshis);
    console.log(sendtotal_satoshis);
    
    //console.log("sendtotal_satoshis " + sendtotal_satoshis);
    
    //var mnemonic = $("#newpassphrase").html();
    
    var privkey = getprivkey(add_from, mnemonic);
    
    
//    $.getJSON( source_html, function( apidata ) {
    $.getJSON( source_html, function( data ) {
        
        var amountremaining = (parseFloat(sendtotal) + parseFloat(transfee));
      
//        var data = apidata.data.unspent;
        
        data.sort(function(a, b) {
            return b.amount - a.amount;
        });
        
        $.each(data, function(i, item) {
            
             var txid = data[i].txid;
             var vout = data[i].vout;
             var script = data[i].scriptPubKey;

            
//             var txid = data[i].tx;
//             var vout = data[i].n;
//             var script = data[i].script;
             var amount = parseFloat(data[i].amount);
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
        
        console.log(total_utxo);
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
        
        console.log(satoshi_change);
        
        var transaction = new bitcore.Transaction();
            
        for (i = 0; i < total_utxo.length; i++) {
            transaction.from(total_utxo[i]);
        }
        
        transaction.to(add_to, sendtotal_satoshis);
            
        if (satoshi_change > 5459) {
            transaction.to(add_from, satoshi_change);
        }
        transaction.sign(privkey);

        var final_trans = transaction.serialize();
        
        console.log(final_trans);
        if (final_trans != 'error') {
			sendBTCpush(final_trans);
			sendBtcOK = 1;
		}
    });
       
}

function sendBTC_blockchaininfo(add_from, add_to, sendtotal, transfee, mnemonic) {
    
    var source_html = "https://blockchain.info/unspent?active="+add_from; //modified 
        
    var total_utxo = new Array();   
    var sendtotal_satoshis = parseFloat(sendtotal).toFixed(8) * 100000000;  
    
    console.log(sendtotal_satoshis);
    sendtotal_satoshis = Math.round(sendtotal_satoshis);
    console.log(sendtotal_satoshis);
    
    var privkey = getprivkey(add_from, mnemonic);

    $.getJSON( source_html, function( data ) {
        
        var amountremaining = (parseFloat(sendtotal) + parseFloat(transfee));
        
        data.unspent_outputs.sort(function(a, b) { //modified
            return b.amount - a.amount;
        });
        
        $.each(data.unspent_outputs, function(i, item) { //modified
            
             var txid = data.unspent_outputs[i].tx_hash_big_endian; //modified
             var vout = data.unspent_outputs[i].tx_output_n; //modified
             var script = data.unspent_outputs[i].script; //modified
             var amount = parseFloat((data.unspent_outputs[i].value)/100000000); //modified
             
             amountremaining = amountremaining - amount;            
             amountremaining.toFixed(8);
    
             var obj = {
                "txid": txid,
                "address": add_from,
                "vout": vout,
                "scriptPubKey": script,
                "amount": amount
             };
            
             total_utxo.push(obj);
              
             //dust limit = 5460 
            
             if (amountremaining == 0 || amountremaining < -0.00005460) {                                 
                 return false;
             }
             
        });
        
        console.log(total_utxo);
        
        if (amountremaining < 0) {
            var satoshi_change = -(amountremaining.toFixed(8) * 100000000).toFixed(0);
        } else {
            var satoshi_change = 0;
        }
        
        console.log(satoshi_change);
        
        var transaction = new bitcore.Transaction();
            
        for (i = 0; i < total_utxo.length; i++) {
            transaction.from(total_utxo[i]);
        }
        
        transaction.to(add_to, sendtotal_satoshis);
            
        if (satoshi_change > 5459) {
            transaction.to(add_from, satoshi_change);
        }
        transaction.sign(privkey);

        var final_trans = transaction.serialize();
        
        console.log(final_trans);
        if (final_trans != 'error') {
			sendBTCpush(final_trans);
			sendBtcOK = 1;
		}
    });
       
}

    
