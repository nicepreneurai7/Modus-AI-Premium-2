const SUPABASE_URL = "https://ctflykqdlribkpdsqccs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Zmx5a3FkbHJpYmtwZHNxY2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzAwNDgsImV4cCI6MjA5ODgwNjA0OH0.YIMSXTH1NKH487EtY0XyfTDKHBOIbqXlKy2tIM2CvI8";
const GENERATE_ENDPOINT = "https://ctflykqdlribkpdsqccs.supabase.co/functions/v1/hyper-worker";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const FREE_MONTHLY_LIMIT = 5;
const HISTORY_SOFT_CAP = 10;
const HISTORY_HARD_CAP = 15;
