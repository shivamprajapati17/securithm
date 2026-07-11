"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "./api";

export function useScans(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  chain?: string;
}) {
  const [data, setData] = useState<api.ScanListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.listScans(params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch scans");
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.status, params?.chain]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useScan(id: string | null) {
  const [data, setData] = useState<api.Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.getScan(id);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch scan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useMonitoredContracts() {
  const [data, setData] = useState<api.MonitoredContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.listMonitoredContracts();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useFindings(params?: { scan_id?: string; severity?: string; status?: string }) {
  const [data, setData] = useState<api.Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.listFindings(params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch findings");
    } finally {
      setLoading(false);
    }
  }, [params?.scan_id, params?.severity, params?.status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
