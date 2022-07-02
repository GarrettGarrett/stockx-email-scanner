

async function getImageFromSx(styleId){
  var myHeaders = new Headers();
  myHeaders.append("authority", "stockx.com");
  myHeaders.append("accept", "application/json");
  myHeaders.append("accept-language", "en-US,en;q=0.9");
  myHeaders.append("app-platform", "Iron");
  myHeaders.append("app-version", "2022.06.19.01");
  myHeaders.append("if-none-match", "W/\"c98-aYU7yA79Azi9ian5PKR9LFOOAPA\"");
  myHeaders.append("referer", "https://stockx.com/nike-dunk-low-retro-white-black-2021");
  myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"102\", \"Google Chrome\";v=\"102\"");
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
  myHeaders.append("sec-fetch-dest", "empty");
  myHeaders.append("sec-fetch-mode", "cors");
  myHeaders.append("sec-fetch-site", "same-origin");
  myHeaders.append("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36");
  myHeaders.append("x-requested-with", "XMLHttpRequest");
  // myHeaders.append("Cookie", "__cf_bm=XpgC2a1N3C.ppDniyGhU833whuDQtyF5RuRSLOex4Mg-1656287717-0-AYRZ6dkTP88h2EzUNcld1o5du54C5Q8leo99iclgH2XM3+8nN9zIXYmQMM0TQSB/sNgi0ir+pVsv4AeoYv9RKRM=");

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  let res = await fetch(`https://stockx.com/api/browse?_search=${styleId}&page=1&resultsPerPage=10&dataType=product`, requestOptions)
  const {Products} = await res.json()
  const firstThumb  = Products[0].media.thumbUrl
  console.log("🚀 ~ file: [id].js ~ line 31 ~ getImageFromSx ~ firstThumb", firstThumb)
  return firstThumb
}


export default async (req, res) => {
    const {
        query: { id },
        method
    } = req
    
    if (req.method === 'GET') {
     
      let firstThumb = await getImageFromSx(id)
      res.status(200).json({ firstThumb })
    }
}

