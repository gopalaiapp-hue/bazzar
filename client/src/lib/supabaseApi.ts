// Supabase API service - replaces all Replit API calls
import { supabase } from './supabaseClient';

// ============ AUTH ============

export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
}

export async function resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://bazaarbudget.app/reset-password', // Deep link will be handled by app
    });
    if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return user;
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ============ USERS ============

export async function getUserById(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateUser(userId: string, updates: any) {
    // First try to update
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (!existing) {
        // User doesn't exist, create with updates
        const { data, error } = await supabase
            .from('users')
            .insert([{ id: userId, ...updates }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }

    // User exists, update
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function createUserProfile(profile: any) {
    const { data, error } = await supabase
        .from('users')
        .upsert([profile], { onConflict: 'id' })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ POCKETS ============

export async function getPockets(userId: string) {
    const { data, error } = await supabase
        .from('pockets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createPocket(pocket: any) {
    const { data, error } = await supabase
        .from('pockets')
        .insert([pocket])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updatePocket(pocketId: number, updates: any) {
    const { data, error } = await supabase
        .from('pockets')
        .update(updates)
        .eq('id', pocketId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ TRANSACTIONS ============

export async function getTransactions(userId: string, limit = 50) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createTransaction(transaction: any) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ BUDGETS ============

export async function getBudgets(userId: string) {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createBudget(budget: any) {
    const { data, error } = await supabase
        .from('budgets')
        .insert([budget])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateBudget(budgetId: number, updates: any) {
    const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', budgetId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ GOALS ============

export async function getGoals(userId: string) {
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createGoal(goal: any) {
    const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateGoal(goalId: number, updates: any) {
    const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ LENA DENA (Debts) ============

export async function getLenaDena(userId: string) {
    const { data, error } = await supabase
        .from('lena_dena')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createLenaDena(entry: any) {
    const { data, error } = await supabase
        .from('lena_dena')
        .insert([entry])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateLenaDena(id: number, updates: any) {
    const { data, error } = await supabase
        .from('lena_dena')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ FAMILY MEMBERS ============

export async function getFamilyMembers(userId: string) {
    const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createFamilyMember(member: any) {
    const { data, error } = await supabase
        .from('family_members')
        .insert([member])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ SUBSCRIPTIONS ============

export async function getSubscriptions(userId: string) {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createSubscription(subscription: any) {
    const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscription])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateSubscription(id: number, updates: any) {
    const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteSubscription(id: number) {
    const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
}

// ============ TAX DATA ============

export async function getTaxData(userId: string) {
    const { data, error } = await supabase
        .from('tax_data')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows
    return data;
}

export async function upsertTaxData(taxData: any) {
    const { data, error } = await supabase
        .from('tax_data')
        .upsert([taxData])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ INVITE CODES ============

export async function getInviteCodeByCreator(creatorId: string) {
    const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
}

export async function createInviteCode(inviteCode: any) {
    const { data, error } = await supabase
        .from('invite_codes')
        .insert([inviteCode])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function validateInviteCode(code: string) {
    const { data, error } = await supabase
        .from('invite_codes')
        .select('*, creator:creator_id(name)')
        .eq('code', code)
        .eq('status', 'active')
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ============ LINKED MEMBERS ============

export async function getLinkedMembers(adminId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('linked_admin_id', adminId);
    if (error) throw new Error(error.message);
    return data || [];
}
