import DataLoader from "dataloader";

interface user {
    id: string,
    name: string,
    invited_by_id?: string;
}

const user_database: Record<string, user> = {
    '1': { id: '1', name: 'Alice', invited_by_id: '2' },
    '2': { id: '2', name: 'Bob', invited_by_id: '3' },
    '3': { id: '3', name: 'Charlie' }
};

const batched_users = async (ids: readonly string[]): Promise<(user | null)[]> => {
    console.log(`-> Fetching users with IDs: ${ids.join(', ')}`);

    const users = ids.map(id => user_database[id] || null);

    return Promise.resolve(users);
};

const user_loader = new DataLoader<string, user | null>(key => batched_users(key));

const run_example = async () => {
    const promise_1 = user_loader.load('1');
    const promise_2 = user_loader.load('2');
    const promise_3 = user_loader.load('1');

    const user_1 = await promise_1;
    const user_2 = await promise_2;
    const user_1_again = await promise_3;

    console.log(`User 1: ${user_1?.name}`);
    console.log(`User 2: ${user_2?.name}`);
    console.log(`User 1 again (cached): ${user_1_again?.name}`);

    const user_3 = await user_loader.load('3');
    console.log(`User 3 ${user_3?.name}`);
};

run_example()
