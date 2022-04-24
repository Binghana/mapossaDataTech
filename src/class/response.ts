//import * as Express from "express";
/**
 * Représentation d'une réponse de MapossaDataTech
 */
export default class Response {
    /**
     * Crée une nouvelle réponse de MapossadataTech
     * @param error indique si une erreur s'est produite ou pas
     * @param message le message de la réponse
     * @param data s'il est présent , représente les données de la réponse, en cas d'erreur data sera errorData
     * qi sont les informations supplémentaires sur l'erreur
     */
    constructor(message: string, error: boolean, data?: object | object[] | unknown) {

        this.error = error;
        this.message = message;
        if (data) {
            if (!this.error) {
                this.data = data as object | object[];
            } else {
                this.errorData = data;
            }
        }
    }

    /**
     * Indique si une érreur s'est produite ou pas
     */
    public error: boolean = false;
    /**
     * Représente le message liés à la réponse
     */
    public message: string;
    /**
     * Représente les données liés à la réponse
     * Si il y a erreur le champ data ne sera pas présents
     */
    public data?: object | object[];
    /**
     * Représente les informations liés à l'erreur qui est survennue
     * Ce champ n'est présent que s'il y a eu une erreur qui s'est produite
     */
    public errorData?: object | unknown;
}
// /**
//  * Cette fonction s'occupe de vérifier si l'identifiant de l'utilisateur
//  * est présent dans la requête
//  */
// export function verifyParamIdUser(request: Express.Request, response: Express.Response) {
//     if (!request.params.idUser) {
//         response.status(200).send(new Response("Il manque l'identifiant de l'utilisateur", true))
//     }
// }
// /**
//  * Cette fonction s'occupe de vérifier la présence des identifiants en paramètres
//  * dans la requête
//  * @param ids un tableau d'identifiant qui contient les id qui doivent être présent dans les paramétres de la requête
//  * @param request Représente la requête
//  * @param response Représente la réponse à la requête
//  */
// export function verifyParamIds(ids : string[],request: Express.Request, response: Express.Response) {
//     const idsManquant : string[] = [];
//     ids.forEach((id)=>{
//         if (! (id in request.params)){
//             idsManquant.push(id);
//         }
//     })
//     if (idsManquant.length > 0){
//         response.status(200).send(new Response("Il manque certains identifiant dans la requête", true, idsManquant));
//     }
// }