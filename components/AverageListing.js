/* This example requires Tailwind CSS v2.0+ */
import { CheckCircleIcon, ChevronRightIcon, MailIcon } from '@heroicons/react/solid'

const applications = [
  {
    applicant: {
      name: 'Ricardo Cooper',
      email: 'ricardo.cooper@example.com',
      imageUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    date: '2020-01-07',
    dateFull: 'January 7, 2020',
    stage: 'Completed phone screening',
    href: '#',
  },
  {
    applicant: {
      name: 'Kristen Ramos',
      email: 'kristen.ramos@example.com',
      imageUrl:
        'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    date: '2020-01-07',
    dateFull: 'January 7, 2020',
    stage: 'Completed phone screening',
    href: '#',
  },
  {
    applicant: {
      name: 'Ted Fox',
      email: 'ted.fox@example.com',
      imageUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    date: '2020-01-07',
    dateFull: 'January 7, 2020',
    stage: 'Completed phone screening',
    href: '#',
  },
]
// {
//     "styleId": "924453-004",
//     "size": "9.5",
//     "total": "$180.44"
// }

export default function AverageListing({matches}) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {matches.map((match, index) => (
          <li key={index}>
            {/* <a href={match.href} className="block hover:bg-gray-50"> */}
              <div className="flex items-center px-4 py-4 sm:px-6">
                <div className="min-w-0 flex-1 flex items-center">
                  <div className="flex-shrink-0">
                    {/* <img className="h-12 w-12 rounded-full" src={match.applicant.imageUrl} alt="" /> */}
                  </div>
                  <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 truncate">{match.styleId}</p>
                      <p className="mt-2 flex items-center text-sm text-gray-500">
                        {/* <MailIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                        <span className="truncate mr-3">Size: {match.size}</span>
                        <span className="truncate">Total: {match.total}</span>
                      </p>
                    </div>
                    
                  </div>
                </div>
                <div>
                  {/* <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                </div>
              </div>
            {/* </a> */}
          </li>
        ))}
      </ul>
    </div>
  )
}
