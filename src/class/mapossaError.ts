
export default class MapossaError extends Error {
    public data: any;
    static readonly ERROR_NO_USER = "Erreur pas d'utilisateur concerné";
    static readonly ERROR_NO_USER_IDENTIFIER = "Erreur il manque l'id de l'utilisateur"
    constructor(message : string, data : any = {}){
        super(message)
        this.data = data;
    }
   
}