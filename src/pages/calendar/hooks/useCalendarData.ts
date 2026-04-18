import { useState, useEffect, useCallback } from 'react';
import { crudService, type Appointment, type Customer, type Service } from '@/services/crudService';
import { getActiveBarbers } from '@/services/teamService';
import type { Barber } from '@/types/settings';
import { useTenant } from '@/hooks/useTenant';

export function useCalendarData(from: string, to: string) {
  const { tenantId } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [apps, custs, servs, brbs] = await Promise.all([
        crudService.getAppointments(tenantId, from, to),
        crudService.getCustomers(tenantId),
        crudService.getServices(tenantId),
        getActiveBarbers(tenantId).catch(() => [] as Barber[]),
      ]);
      setAppointments(apps);
      setCustomers(custs);
      setServices(servs);
      setBarbers(brbs);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    appointments,
    customers,
    services,
    barbers,
    loading,
    refetch: fetchData,
  };
}