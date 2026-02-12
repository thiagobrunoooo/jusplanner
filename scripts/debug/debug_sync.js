const isNewer = (remoteRow, localRow) => {
    if (!remoteRow) return false;
    if (!localRow) return true;
    if (!localRow.updated_at) return true;
    if (!remoteRow.updated_at) return false;
    return new Date(remoteRow.updated_at) > new Date(localRow.updated_at);
};

const t1 = new Date().toISOString();
console.log("T1 (Check):", t1);

setTimeout(() => {
    const t2 = new Date().toISOString();
    console.log("T2 (Uncheck):", t2);

    const remote = { updated_at: t1, status: 'checked' };
    const local = { updated_at: t2, status: 'unchecked' };

    console.log("Remote > Local?", isNewer(remote, local)); // Should be false
    console.log("Local > Remote?", isNewer(local, remote)); // Should be true

    // Simulate equal timestamps
    const remoteEq = { updated_at: t2 };
    console.log("RemoteEq > Local?", isNewer(remoteEq, local)); // Should be false
}, 100);
