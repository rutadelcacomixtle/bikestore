import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, User } from 'lucide-react'
import { profileService } from '@/lib/supabase'
import { Card, CardBody } from '@/components/ui/Card'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async (q = '') => {
    setLoading(true)
    try {
      setCustomers(await profileService.list(q))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    load(q)
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Clientes</h1>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {customers.map((c) => (
            <Card key={c.id} onClick={() => navigate(`/owner/customers/${c.id}`)}>
              <CardBody className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full p-2">
                  <User size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
