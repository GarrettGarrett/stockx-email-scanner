export async function sendWebhookManyStockX(_fineParseArray, webhookUrl) {


    function handleTooLongUrl(url) {
        if (url.length > 200) {
            return ''
        }
        else return url
    }

    function returnEmailType(_fineParse){
        let result = ''
        if (_fineParse?.hasDeliveredEmail) {
            result = "🎉 Delivered"
        } else if  (_fineParse?.isRefund ){
            result = "Refund Issued"
        } else if (_fineParse?.hasConfirmedEmail ) {
            result = "👍 Confirmed"
        }
        return result
    }


    function isDeliveredEmail(_fineParse){
        if (_fineParse?.hasDeliveredEmail) {
            return true
        }
        return false
    }

    function hexToDecimal(hex) {
        return parseInt(hex.replace("#",""), 16)
    }

    var myHeaders = new Headers();
    myHeaders.append("authority", "discord.com");
    myHeaders.append("accept", "*/*");
    myHeaders.append("accept-language", "en-US,en;q=0.9");
    myHeaders.append("content-type", "application/json");
    myHeaders.append("origin", "https://dev.to");
    myHeaders.append("referer", "https://dev.to/");
    myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
    myHeaders.append("sec-fetch-dest", "empty");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "cross-site");




    function removeSizeFromTitle(longUrl){
        let start = longUrl.indexOf("(") - 1
        let end = longUrl.indexOf(")") - 1
        let startString = longUrl.slice(0, start)
        let endString = longUrl.slice(end + 2, longUrl.length)
        let combined = startString + endString
        return combined
    }


    let allEmbeds = []
    _fineParseArray.forEach(_fineParse => {

        // let imageUrlWithProduct = `https://images.stockx.com/images/${removeSizeFromTitle(_fineParse.title.replaceAll(" ", "-").replaceAll(".", ""))}-Product.jpg`
        // let imageUrlNoProduct = `https://images.stockx.com/images/${removeSizeFromTitle(_fineParse.title.replaceAll(" ", "-").replaceAll(".", ""))}.jpg`
        // console.log("🚀 ~ file: Discord.js ~ line 53 ~ sendWebhook ~ imageUrlNoProduct", imageUrlNoProduct)
        // console.log("🚀 ~ file: Discord.js ~ line 52 ~ sendWebhook ~ imageUrlWithProduct", imageUrlWithProduct)

        var myEmbed = {
            author: {
              name: "New StockX Email Detected",
            },
            thumbnail: { url:  handleTooLongUrl(_fineParse?.image)},
            title: _fineParse.title,
            description: `Style ID: ${_fineParse.styleID}\nOrder: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nTotal: ${_fineParse.totalPayment}\nEmail Type: ${returnEmailType(_fineParse)}`,
            color: hexToDecimal("#5B9D66"),
            timestamp: new Date()
        }

        allEmbeds.push(myEmbed)
    })

    

      var raw = JSON.stringify({
        username: "StockX Importer",
        embeds: allEmbeds,
        avatar_url: "https://i.imgur.com/fYrDHMk.png",
    })
    

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    var messageDiscord =  await fetch("https://discord.com/api/webhooks/" + webhookUrl, requestOptions)

    
        return messageDiscord.status
}


