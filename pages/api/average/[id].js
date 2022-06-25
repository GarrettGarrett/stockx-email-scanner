const Imap = require('imap');
const {simpleParser} = require('mailparser');
const { GoogleSpreadsheet } = require('google-spreadsheet') // Google sheet npm package
const fs = require('fs'); // File handling package



const RESPONSES_SHEET_ID = '1gxQKq2KzFFirj-5aFaMLKBqgLA3d_8hhoEvAoKe8DCU'; // spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet(RESPONSES_SHEET_ID); // const RESPONSES_SHEET_ID = '19lo-6eEXYmu_gw5FgyeVZJ9DoJblPQTVbVorSL1Ppus';

async function getDoc() {
    let document = await doc.useServiceAccountAuth({
      client_email: process.env.CLIENT_EMAIL,
      private_key:  process.env.private_key,
    });
    return document
  }

const connectDoc = getDoc()


async function readSheets(styleIdsize){
    // combine styleID + size for all entries. make that the key.  Make the value total price.
    // step 1 - read style id and size column
    await doc.loadInfo();
    let unsoldSX = doc.sheetsByTitle["Unsold SX"]; //stockx importer tab
    let unsoldGoat = doc.sheetsByTitle["Unsold GOAT"] //goat importer tab
    let unsoldConsigned = doc.sheetsByTitle["Unsold Consigned"] //goat unsold tab - used only for GOAT, when shoe is stored - can be written into unsold tab.


    const rowsSX = await unsoldSX.getRows()
    const rowsGoat = await unsoldGoat.getRows()
    const rowsConsigned = await unsoldConsigned.getRows()

    let returnObject = []
    let sxRaw = []
    let goatRaw = []
    let consignedRaw = []

    rowsSX.forEach((row, index) => {
        let data = {}
        data.styleId = row['Style ID']
        data.size = row['Size']
        data.total = row['Total Payment']
        sxRaw.push(data)
    })
    rowsGoat.forEach((row, index) => {
      let data = {}
      data.styleId = row['Style ID']
      data.size = row['Size']
      data.total = row['Sub Total']
      goatRaw.push(data)
  })
  rowsConsigned.forEach((row, index) => {
    let data = {}
    data.styleId = row['Style ID']
    data.size = row['Size']
    data.total = row['Total Paid']
    consignedRaw.push(data)
})

    returnObject.push({"SX":sxRaw})
    returnObject.push({"Goat":goatRaw})
    returnObject.push({"Consigned":consignedRaw})
    return returnObject
}

function findMatch(id, allSheetData){
    let sxValues = allSheetData[0]['SX']
    let goatValues = allSheetData[1]['Goat']
    let consignedValues = allSheetData[2]['Consigned']

    let matches = []
    
    sxValues.forEach(obj => {
      let styleId = obj.styleId
      let size = obj.size
      let cleanStyleId = cleanUpStyleId(styleId)
      let cleanSize = cleanUpSize(size)
      if (cleanStyleId + cleanSize == id){
        matches.push(obj)
      }
    })
    goatValues.forEach(obj => {
      let styleId = obj.styleId
      let size = obj.size
      let cleanStyleId = cleanUpStyleId(styleId)
      let cleanSize = cleanUpSize(size)
      if (cleanStyleId + cleanSize == id){
        matches.push(obj)
      }
    })
    consignedValues.forEach(obj => {
      let styleId = obj.styleId
      let size = obj.size
      let cleanStyleId = cleanUpStyleId(styleId)
      let cleanSize = cleanUpSize(size)
      if (cleanStyleId + cleanSize == id){
        matches.push(obj)
      }
    })

    return matches
    
}

function cleanUpStyleId(string){
  let parse1 = string.replaceAll("-", "")
  let parse2 = parse1.trim()
  let parse3 = parse2.replaceAll("/","")
  let parse4 = parse3.replaceAll(" ", "")
  return parse4
}

function cleanUpSize(string){
  function hasNumber(myString) {
    return /\d/.test(myString);
  }
  function removeAlpha(string){
    string = string.replace(/\D/g,'')
    return string
  }

  let split = string.split(" ")
  
  let res 
  let resultFound = false

  split.forEach(item => {
    if (hasNumber(item) && !resultFound) {
      res = removeAlpha(item)
      resultFound = true
    }
  })
  return res
}

function cleanUpId(styleId, size) {
  let cleanStyleId = cleanUpStyleId(styleId)
  let cleanSize = cleanUpSize(size)
  return cleanStyleId + cleanSize
}


function calcAverage(matches){
  let total = 0
  matches.forEach(match => {
    console.log("🚀 ~ file: [id].js ~ line 163 ~ calcAverage ~ parseInt(match.total)",Number(match.total.replace(/[^0-9.-]+/g,"")))

    total +=  Number(match.total.replace(/[^0-9.-]+/g,""));
  })
  let average = total / matches.length
  console.log("🚀 ~ file: [id].js ~ line 166 ~ calcAverage ~ matches.length", matches.length)
  console.log("🚀 ~ file: [id].js ~ line 166 ~ calcAverage ~ average", average)
  return average
}

export default async (req, res) => {
    const {
        query: { id },
        method
    } = req
    
    if (req.method === 'GET') {
      let split = id.split("@")
      let styleId = split[0]
      let size = split[1]

      let cleanId = cleanUpId(styleId, size) //combined styleid + size into 1 clean string
      console.log("🚀 ~ file: [id].js ~ line 172 ~ cleanId", cleanId)

      let sheetData = await readSheets(cleanId)
      console.log("🚀 ~ file: [id].js ~ line 186 ~ sheetData", sheetData)
      

      let matches = findMatch(cleanId, sheetData) //all entries that have styleid + size, this includes the original entry
      console.log("🚀 ~ file: [id].js ~ line 190 ~ matches", matches)

      let average = calcAverage(matches)
      console.log("🚀 ~ file: [id].js ~ line 192 ~ average", average)
     
        res.status(200).json({ average, matches })
     
      
    }
}

