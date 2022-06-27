import { useRouter } from 'next/router'
import useSWR from "swr";
import AverageListing from '../../components/AverageListing';
import LoadingLottie from '../../components/LoadingLottie';
import { useEffect, useState} from 'react'

const fetcher = (url) => fetch(url).then((res) => res.json());


const Average = () => {
  const router = useRouter()
  const { id } = router.query
  const data = useSWR('/api/average/' + id, fetcher)
  const [thumb, setThumb] = useState()
  console.log("🚀 ~ file: [id].js ~ line 12 ~ Average ~ data", data.data)

  useEffect(async () => {
    if (data?.data?.matches) {
        let thumbnail = await fetch(`/api/getImage/` + data?.data.matches[0].styleId)
        const {firstThumb} = await thumbnail.json()
        setThumb(firstThumb)
    }
  }, [data])
  

function round(value, decimals) {
    if (value == null) {
        return "This item is not in Unsold Sx, Goat, or Consigned"
    }
    return `Average: $${Number(Math.round(value+'e'+decimals)+'e-'+decimals)}`
   }   


  if (!data?.data) {
      return (
          <>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <LoadingLottie />
                </div>
            </div>
        
          </>
      )
  }
  return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h2 className="py-4 text-3xl font-extrabold text-black sm:text-4xl">{`${round(data.data.average, 2)}`}</h2>
                 <AverageListing matches={data.data.matches} thumb={thumb}/>
            </div>
        </div>
      </>
  )

}

export default Average