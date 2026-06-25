export class Profiler {
    static shared = new Profiler()

    private profiles: Map<string, Profile> = new Map<string, Profile>()

    private constructor() {}

    getProfile(key: string): Profile {
        if (this.profiles.has(key)) {
            return this.profiles.get(key)!
        } else {
            const profile = new Profile()
            this.profiles.set(key, profile)
            return profile
        }
    }
}

class Profile {
    private startTime: number | null = null
    private endTime: number | null = null

    start() {
        this.startTime = performance.now()
    }

    end() {
        if (!this.startTime) {
            return
        }

        this.endTime = performance.now()

        return (this.endTime - this.startTime).toFixed(2)
    }

    peek() {
        if (!this.startTime || this.endTime) {
            return
        }

        return (performance.now() - this.startTime).toFixed(2)
    }
}
