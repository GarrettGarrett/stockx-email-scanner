export async function discordArrayConfirmDelivery(_fineParseArray, webhookUrl) {





    function hexToDecimal(hex) {
        return parseInt(hex.replace("#",""), 16)
    }

    let allEmbeds = []
    _fineParseArray.forEach(async _fineParse => {
        var myEmbed = {
            author: {
              name: "StockX Delivery Confirmed",
            },
            thumbnail: { url: _fineParse["Image"] },
            title: _fineParse["Title"],
            description: `Style ID: ${_fineParse['Style ID']}\nOrder: ########-####${_fineParse['Order Number'].toString().substring(_fineParse['Order Number'].length - 4)}`,
            color: hexToDecimal("#4B6FE4"),
            timestamp: new Date()
        }
        console.log("🚀 ~ file: DiscordArrayConfirmDelivery.js ~ line 53 ~ discordArrayConfirmDelivery ~ myEmbed", myEmbed)

        allEmbeds.push(myEmbed)
      
    })   


    console.log("🚀 ~ file: DiscordArrayConfirmDelivery.js ~ line 55 ~ discordArrayConfirmDelivery ~ allEmbeds", allEmbeds)

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

      var raw = JSON.stringify({
        username: "Google Sheets",
        embeds: allEmbeds,
        avatar_url: "https://i.imgur.com/8xJLvYS.png",
    })

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    var messageDiscord =  await fetch("https://discord.com/api/webhooks/" + webhookUrl, requestOptions)
    console.log("🚀 ~ file: DiscordArrayConfirmDelivery.js ~ line 90 ~ discordArrayConfirmDelivery ~ messageDiscord", messageDiscord)

    
    return messageDiscord.status
}
