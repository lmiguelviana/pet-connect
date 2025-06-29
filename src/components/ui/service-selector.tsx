'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Service } from '@/types/services';
import { ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface ServiceSelectorProps {
  selectedService: Service | null;
  onServiceSelect: (service: Service | null) => void;
  className?: string;
}

export function ServiceSelector({
  selectedService,
  onServiceSelect,
  className = ''
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          name,
          description,
          category,
          price,
          duration_minutes,
          is_active
        `)
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) {
        console.error('Erro ao carregar serviços:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedServices = filteredServices.reduce((acc, service) => {
    const category = service.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">
          Serviço
        </label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Serviço *
      </label>
      
      {/* Serviço Selecionado */}
      {selectedService && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">{selectedService.name}</h4>
              <p className="text-sm text-blue-700">{selectedService.category}</p>
              {selectedService.description && (
                <p className="text-sm text-blue-600 mt-1">{selectedService.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-blue-700 mb-1">
                <ClockIcon className="h-4 w-4 mr-1" />
                {formatDuration(selectedService.duration_minutes)}
              </div>
              <div className="flex items-center text-sm font-medium text-blue-900">
                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                {formatPrice(selectedService.price)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onServiceSelect(null)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Alterar serviço
          </button>
        </div>
      )}

      {/* Seletor de Serviços */}
      {!selectedService && (
        <div className="space-y-3">
          {/* Campo de Busca */}
          <input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Lista de Serviços */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {Object.keys(groupedServices).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
              </div>
            ) : (
              Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                    {category}
                  </div>
                  {categoryServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => onServiceSelect(service)}
                      className="w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDuration(service.duration_minutes)}
                          </div>
                          <div className="flex items-center text-sm font-medium text-gray-900">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {formatPrice(service.price)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}