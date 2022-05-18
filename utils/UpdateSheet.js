export async function sendWebhook(_fineParseArray) {
    await doc.loadInfo();
    let sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows()
  
    let bulkArray = []
    let singleArray = []
  
    _fineParseArray.forEach (_fineParse => {
      if (_fineParse?.hasDeliveredEmail){ //dealing with delivered entry
        let deliveredEmailMatched = false // check to see if a confirmed entry exists - fine if it doesnt.
        rows.forEach((row, index) => {
            if (row['Order Number'] == _fineParse.orderNumber) {
                rows[index]['hasDeliveredEmail'] = _fineParse.hasDeliveredEmail
                rows[index]['Delivery Date'] = _fineParse.date
                rows[index].save()
                console.log("sheet updated")
                deliveredEmailMatched = true
      } else if (_fineParse?.hasConfirmedEmail) { //dealing with confirmed entry
        let confirmedEmailMatched = false // check to see if a confirmed entry exists - fine if it doesnt.
        rows.forEach((row, index) => {
            if (row['Order Number'] == _fineParse.orderNumber) {
                rows[index]['hasConfirmedEmail'] = _fineParse.hasConfirmedEmail
                rows[index]['Purchase Date'] = _fineParse.date
                rows[index].save()
                console.log("sheet updated")
                confirmedEmailMatched = true
            }
        })
      } else { //not matching up, creating new row but after added to bulk
        bulkArray.push(_fineParse)
      }
    })
  
  
    console.log("Bulk: ", bulkArray)
    const moreRows = await sheet.addRows(bulkArray)
    console.log("Done adding rows")
    rows.save
    return true
}})}
