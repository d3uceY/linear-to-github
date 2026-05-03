export namespace transfer {
	
	export class Options {
	    linearApiKey: string;
	    githubToken: string;
	    githubOwner: string;
	    githubRepo: string;
	    linearTeamId: string;
	    delayMs: number;
	
	    static createFrom(source: any = {}) {
	        return new Options(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.linearApiKey = source["linearApiKey"];
	        this.githubToken = source["githubToken"];
	        this.githubOwner = source["githubOwner"];
	        this.githubRepo = source["githubRepo"];
	        this.linearTeamId = source["linearTeamId"];
	        this.delayMs = source["delayMs"];
	    }
	}

}

