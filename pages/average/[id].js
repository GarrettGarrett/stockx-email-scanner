import { useRouter } from 'next/router'
import useSWR from "swr";
import AverageListing from '../../components/AverageListing';

const fetcher = (url) => fetch(url).then((res) => res.json());


const Average = () => {
  const router = useRouter()
  const { id } = router.query
  const data = useSWR('/api/average/' + id, fetcher)
  console.log("🚀 ~ file: [id].js ~ line 12 ~ Average ~ data", data.data)

function round(value, decimals) {
    if (value == null) {
        return "This item is not in Unsold Sx, Goat, or Consigned"
    }
    return `Average: $${Number(Math.round(value+'e'+decimals)+'e-'+decimals)}`
   }   

  if (!data?.data) {
      return <p>Loading</p>
  }
  return (
      <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h2 className="py-2 text-3xl font-extrabold text-black sm:text-4xl">{`${round(data.data.average, 2)}`}</h2>
                 <AverageListing matches={data.data.matches}/>
            </div>
        </div>
      </>
  )

}

export default Average