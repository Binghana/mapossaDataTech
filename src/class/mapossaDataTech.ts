import { auth } from "./@interface";
import { logger } from "firebase-functions/v1";
//import CarteDeFidelite from "./mapossaBusiness/carteDeFidelite";
//import Offre from "./mapossaBusiness/offre";
import MapossaError from "./mapossaError";
import Categorie from "./mapossaSmartWallet/categorie";
//import Categorie from "./mapossaSmartWallet/categorie";
import CompteFinancier from "./mapossaSmartWallet/compteFinancier";
import Transaction from "./mapossaSmartWallet/transaction";
import User from "./user";
//import { createUserOnAdalo } from "../adalo/request";


/**
 * Cette clase représente toutes les actions à répercussions de 
 * Mapossa dataTech
 */
export default class MapossaDataTech {

    /**
     * 
     * @param idUser 
     * @param transaction 
     * @returns 
     */
    public static async creerTransaction(idUser: string, transaction: any) {
        // "montant" in prototype && "typeFinal" in prototype && "idCompte" in prototype  && "flux" in prototype
        if (!(Transaction.isTransaction(transaction))) throw new MapossaError("La transaction créer n'est pas valide car il manqque : un des 4 attributs idCompte, typeFinal,montant ou flux", transaction);
        logger.log(idUser);
        logger.log(transaction);
        const c = await CompteFinancier.getById(idUser, transaction.idCompte as string);

        if (!c.exists) throw new Error("Le compte de la transaction que l'on souhaite créer n'existe ");

        const compte = c.data() as CompteFinancier;

        if (transaction.flux == "Sortant") {
            await compte.retirer(idUser, transaction.montant);
        } else if (transaction.flux == "Entrant") {
            await compte.deposer(idUser, transaction.montant);
        } else {
            throw new Error("La transaction que l'on souhaite créer a un flux invalide");
        }

        if (!(transaction instanceof Transaction)) transaction = Transaction.normalize(transaction);
        await transaction.create(idUser);

        const ids: {
            idMere: string,
            idFrais?: string
        } = { idMere: transaction.id as string };

        if ("frais" in transaction && transaction.frais > 0) ids.idFrais = await transaction.createFrais(idUser);

        return ids;

    }
    /**
     * 
     * @param idUser 
     * @param transaction 
     * @param idCompteDest 
     * @returns 
     */
    public static async creerTransactionVirement(idUser: string, transaction: any, idCompteDest: string) {

        if (!(Transaction.isTransaction(transaction))) throw new MapossaError("La transaction créer n'est pas valide ", transaction);
        if (!(transaction.typeFinal == "Virement")) throw new MapossaError("Le virement que l'on souhaite créer n'a pas comme type final virement");

        // logger.log(idUser);
        // logger.log(transaction);
        const c = await CompteFinancier.getById(idUser, transaction.idCompte as string);
        if (!c.exists) throw new MapossaError("Le compte du virement que l'on souhaite créer n'existe pas ");

        const cDest = await CompteFinancier.getById(idUser, idCompteDest);
        if (!cDest.exists) throw new MapossaError("Le compte destinataire du virement n'existe pas ");

        const compte = c.data() as CompteFinancier;
        //const compteDest = cDest.data() as CompteFinancier;

        const ids: {
            idMere?: string,
            idFrais?: string,
            idFille?: string,
        } = {};


        if (transaction.flux == "Sortant") {
            compte.retirer(idUser, transaction.montant);
            let virement2 = Transaction.normalize(transaction);
            virement2.idCompte = idCompteDest;
            virement2.flux = "Entrant";
            virement2.frais = 0;
            let idsV2 = await MapossaDataTech.creerTransaction(idUser, virement2);
            ids.idFille = idsV2.idMere;
        } else if (transaction.flux == "Entrant") {

            throw new MapossaError("Le flux d'un virement doit etre sortant pour le compte émetant le virement", { "fluxRecu": "Entrant", "idCompteConcerne": compte.id })
            //compte.deposer(idUser, transaction.montant);

        } else {
            throw new MapossaError("La transaction que l'on souhaite créer a un flux invalide", { "fluxRecu": transaction.flux });
        }

        if (!(transaction instanceof Transaction)) transaction = Transaction.normalize(transaction);
        await transaction.create(idUser);
        ids.idMere = transaction.id;

        if ("frais" in transaction && transaction.frais > 0) ids.idFrais = await transaction.createFrais(idUser);

        return ids;
    }
    /**
     * 
     * @param idUser 
     * @param compte 
     * @returns 
     */
    public static async creerCompteFinancier(idUser: string, compte: any) {
        if (!CompteFinancier.isCompteFinancier(compte)) throw new MapossaError("Le compte financier envoyé n'est pas valide");
        if ("numero" in compte) {
            const compteSN = await CompteFinancier.getWithNumber(idUser, compte.numero)
            if (!(compteSN.empty)) throw new MapossaError("Un compte financier avec ce numéro existe déjà", compteSN.docs);
        }

        compte = CompteFinancier.normalize(compte);

        compte.sommeEntree = 0;
        compte.sommeSortie = 0;
        compte.soldeInitial = compte.solde;

        await compte.create(idUser);
        const ids: {
            idCompte: string,
            idTransactionInitialisation?: string
        } = {
            idCompte: compte.id,
        }
        /**
         * On ne créee plus la transacton d'initialisation
         */
        // if (compte.solde > 0) {
        //     let transactionInit = new Transaction();

        //     transactionInit.idCompte = compte.id;
        //     transactionInit.typeInitial = "Initialisation";
        //     transactionInit.typeFinal = "Revenu";
        //     transactionInit.montant = compte.solde;
        //     transactionInit.flux = "Entrant";
        //     transactionInit.create(idUser);
        //     ids.idTransactionInitialisation = transactionInit.id;
        // }

        return ids;
    }


    public static async modifierCompteFinancier(idUser: string, compte: any) {
        if (!CompteFinancier.isCompteFinancier(compte)) throw new MapossaError("Le compte financier envoyé n'est pas valide", CompteFinancier);
        const oldDataCompteRef = await CompteFinancier.getById(idUser, compte.id as string);
        const newDataCompte = CompteFinancier.normalize(compte);

        if (!oldDataCompteRef.exists) throw new MapossaError("Le compte que l'on souhaite modifier n'existe pas ");

        const oldDataCompte = oldDataCompteRef.data() as CompteFinancier;
        const diff = oldDataCompte.solde - newDataCompte.solde;

        const ids: {
            idCompte: string,
            idTransactionAjustementSolde?: string
        } = {
            idCompte: compte.id as string,
        }
        newDataCompte.solde = oldDataCompte.solde;
        newDataCompte.sommeEntree = oldDataCompte.sommeEntree;
        newDataCompte.sommeSortie = oldDataCompte.sommeSortie
        newDataCompte.soldeInitial = oldDataCompte.soldeInitial;


        await newDataCompte.update(idUser);
        if (diff == 0) {
            // on ne crée pas de transaction d'justement de solde
        } else if (diff > 0) {
            const transactionAjustementDeSolde = new Transaction();
            transactionAjustementDeSolde.montant = Math.abs(diff);
            transactionAjustementDeSolde.typeInitial = "Ajustement";
            transactionAjustementDeSolde.typeFinal = "Depense";
            transactionAjustementDeSolde.flux = "Sortant";
            transactionAjustementDeSolde.idCompte = oldDataCompte.id;
            let id = await MapossaDataTech.creerTransaction(idUser, transactionAjustementDeSolde);
            ids.idTransactionAjustementSolde = id.idMere;

        } else {
            const transactionAjustementDeSolde = new Transaction();
            transactionAjustementDeSolde.montant = Math.abs(diff);
            transactionAjustementDeSolde.typeInitial = "Ajustement";
            transactionAjustementDeSolde.typeFinal = "Revenu";
            transactionAjustementDeSolde.flux = "Entrant";
            transactionAjustementDeSolde.idCompte = oldDataCompte.id;
            let id = await MapossaDataTech.creerTransaction(idUser, transactionAjustementDeSolde);
            ids.idTransactionAjustementSolde = id.idMere;
        }

        return ids;
    }

    public static async suprimeTransaction(idUser: string, idTransaction: string) {

        let refTransaction = await Transaction.getById(idUser, idTransaction);
        if (!refTransaction.exists) throw new MapossaError("La transaction d'identifiant : " + idTransaction + " n'existe pas", { idTransactionRecu: idTransaction });
        let transaction = refTransaction.data() as Transaction;

        const trransactionsFilles = await transaction.getAllOf(idUser);
        if (!trransactionsFilles.empty) {
            const promises: Promise<any>[] = [];
            trransactionsFilles.docs.forEach((t) => {
                if (t.exists) {
                    promises.push(MapossaDataTech.suprimeTransaction(idUser, t.id))
                }
            })
            await Promise.all(promises);
        }


        let refCompte = await CompteFinancier.getById(idUser, transaction.idCompte as string);
        if (!refCompte.exists) throw new MapossaError("Le compte de la transaction que l'on souhaite supprimer n'existe pas ", { "idCompteRecu": transaction.idCompte });
        let compte = refCompte.data() as CompteFinancier;

        if (transaction.flux = "Entrant") {
            compte.sommeEntree -= transaction.montant;
            compte.updateSolde(idUser);
        } else if (transaction.flux = "Sortant") {
            compte.sommeEntree -= transaction.montant;
            compte.updateSolde(idUser);
        } else {
            throw new MapossaError("Le flux de la transaction que l'on souhaite supprimer n'est pas valide", { "fluxRecu": transaction.flux });
        }
        await Transaction.delete(idUser, idTransaction);
    }

    public static async modifieTransaction(idUser: string, bodyTransacion: any, idTransaction: string) {
        logger.log(bodyTransacion);
        const refTransaction = await Transaction.getById(idUser, idTransaction);

        if (!refTransaction.exists) throw new MapossaError("La transaction que l'on souhaite modifier n'existe pas", { "idRecu": idTransaction });
        let transaction = refTransaction.data() as Transaction;

        if (!Transaction.isTransaction(bodyTransacion)) throw new MapossaError("La transaction que l'on souhaite modifer n'est pas valide", bodyTransacion);
        if (!(bodyTransacion instanceof Transaction)) bodyTransacion = Transaction.normalize(bodyTransacion);


        let refCompte = await CompteFinancier.getById(idUser, transaction.idCompte as string);
        if (!refCompte.exists) throw new MapossaError("Le compte de la transaction que l'on souhaite modifier n'existe pas", { "idCompteRecu": transaction.idCompte });
        let compte = refCompte.data() as CompteFinancier;

        logger.log("On comence à regarder si la transacion est un virement entrant")
        if (!(transaction.typeFinal == "Virement" && transaction.flux == "Entrant" && (!("parent" in transaction) || transaction.parent == ""))) {

            logger.log("Bon ce n'est pas un virement entrant");

            const trransactionsFilles = await transaction.getAllOf(idUser);
            logger.log(trransactionsFilles);

            if (!trransactionsFilles.empty) {
                const promises: Promise<any>[] = [];
                trransactionsFilles.docs.forEach((t) => {
                    logger.log("checkons la transaction i");
                    logger.log(t.data());
                    if (t.exists) {
                        if (t.data().typeFinal == "Virement" && t.data().flux == "Entrant") {
                            let nt = t.data();
                            nt.montant = transaction.montant;
                            promises.push(MapossaDataTech.modifieTransaction(idUser, nt, t.id))

                        } else if (t.data().typeFinal == "Depense" && t.data().frais == 0) {
                            logger.log("On est sur que c'est un frais financier");
                            let frais = t.data();
                            logger.log(frais.montant);
                            logger.log(bodyTransacion.frais);
                            if (frais.montant != bodyTransacion.frais) {
                                frais.montant = bodyTransacion.frais;
                                promises.push(MapossaDataTech.modifieTransaction(idUser, frais, frais.id as string));
                            }

                        }
                    }
                })
                await Promise.all(promises);
            }
        }


        const diff = transaction.montant - bodyTransacion.montant;
        // diminution

        if (transaction.flux = "Entrant") {
            compte.sommeEntree += diff;
            compte.updateSolde(idUser);
        } else if (transaction.flux = "Sortant") {
            compte.sommeEntree += diff;
            compte.updateSolde(idUser);
        } else {
            throw new MapossaError("Le flux de la transaction que l'on souhaite modifer n'est pas valide", { "fluxRecu": transaction.flux });
        }
        //augmentation

        bodyTransacion.id = transaction.id;
        await Transaction.update(idUser, bodyTransacion);

    }
    /*-------------------------------------------------------------------------------------------------------------------------*/

    public static async creerCarteDeFidelite(carteDeFidelite: any) {
        // on vérifie si la carte de fidelité a les informations minimale d'une carte de fidelité
        /*  if ( ! CarteDeFidelite.isCarteDeFidelite(carteDeFidelite)) throw new MapossaError("La carte de fidelité envoyé n'est pas valide \nil manque soit l'id de l'entreprise, soit le logo");
  
      
          // on crée la carte de fielité
          let idCarte  = await CarteDeFidelite.create(carteDeFidelite);
          // on créee un offre de départ 
          let coupon = new Offre();
          throw new MapossaError("Error not Implemented", { description: "On vient de la carte de fidelité ainsi que le coupon mais la suite n'as pas été implementée"});
          //
      }
      public static async creerOffre(idCarteDeFidelite : string , offre : any ) {
          // On vérifie que l'offre est ne offre alude
  
          if (! Offre.isOffre(offre)) throw new MapossaError("L'offre que l'on souhaite créer n'est ps une offre valide car il manque soit ")
      */
    }

    public static async deleteCategorie(idUser: string, idCategorie: string) {
        /*
        // on récupère la catégorie
        let categorie  = await Categorie.getById( idUser , idCategorie);

        // on récupère les catégories filles
        */
    }
    public static async createCategorie(idUser: string, categorie: any) {

        // on vrifie si l'utiilsateur est premium
        //



        // sinon on vérifie qu'il n'a pas de catégories personnel
        const cats = await Categorie.getAllOfUser(idUser);
        let userAlreadyHasPersonnalCat = false;
        logger.log("Voivci toutes les cagtégories de l'utilisateurs")
        logger.log(cats)
        cats.forEach((c) => {
            if (!c.isAuto) userAlreadyHasPersonnalCat = true;
        })
        logger.log("Voyons si l'utilisateur a déja une categorie auto")
        logger.log(userAlreadyHasPersonnalCat)
        if (userAlreadyHasPersonnalCat) {
            if (!User.isPremium(idUser)) throw new MapossaError("Il faut passer premium pour ajouter une autre catégorie personnel");
        }
        if (!Categorie.isCategorie(categorie)) throw new MapossaError("La catégorie que l'on souhaite créer n'est pas valide ", categorie)
        categorie = Categorie.normalize(categorie);
        return await Categorie.create(idUser, categorie);
        // si il a déjçà une caégorie personelle alors on lui retounbe le fait qu'il doit passer premium

        //sinon on créee la catégorie

    }
    public static async createUser(user: any) {
        // on créee l'utilisateur sur firebase
        if (!("email" in user && user.email)) throw new MapossaError("Il manque l'email de l'utilisateur");
        //if (!( ("isSmartWallet" in request.body ) || ("isBusiness" in request.body))  ) response.send(new Response("Il faut préciser si l'utilisateur est un smartwallet et ou un business", true )).status(201);

        const gtu = User.toGoogleUser(user);
        const gUser = await auth.createUser(gtu);

        console.log(gUser);
        // const nuser = await User.create({ uid: gUser.uid, ...user })
        // logger.log(nuser)
        // const adaloUser = await createUserOnAdalo(nuser);
        // nuser.idAdalo = adaloUser.id ;
        // logger.log(nuser)
        // await User.update(nuser);
        // // création des catégories automatique de l'utilisateur
        // const categoriesAuto : any[]= [];

        // categoriesAuto.push ( Categorie.construct("Crédit de communication","Depense",""))

        // categoriesAuto.push ( Categorie.construct("Crédit appel","Depense",""))
        // categoriesAuto.push ( Categorie.construct("Crédit de SMS","Depense",""))
        // categoriesAuto.push ( Categorie.construct("Crédit internet","Depense", ""))
        // categoriesAuto.push ( Categorie.construct("Loisir", "Depense", ""))
        // categoriesAuto.push ( Categorie.construct("Famille", "Depense" , ""))
        // categoriesAuto.push ( Categorie.construct("Transport", "Depense" , ""))
        // categoriesAuto.push ( Categorie.construct("Alimentation", "Depense" , ""))
        // categoriesAuto.push ( Categorie.construct("Cadeaux", "Depense" , ""))
        // categoriesAuto.push ( Categorie.construct("Logement", "Depense" , ""))
        // categoriesAuto.push ( Categorie.construct("Achat", "Depense" , ""))


        // categoriesAuto.push ( Categorie.construct("Salaire", "Revenu", ""))
        // categoriesAuto.push ( Categorie.construct("Rendement sur investissement", "Revenu" , ""))

        // categoriesAuto.push ( Categorie.construct("Virement pour paiement", "Virement" , ""))
        // categoriesAuto.push ( Categorie.construct("Virement récurrent", "Virement" , ""))
        // categoriesAuto.push ( Categorie.construct("Virement exceptionnel", "Virement" , ""))

        // await Categorie.bulkCreate(nuser.id , categoriesAuto);

        // return nuser;
    };

    public static getAllLogoOfCategorie() {
        return Categorie.getAllLogo();
    }

    public static async bulkCreateTransactionAuto(idUser: string, transactions: Array<any>) {

        if (transactions.length < 1) throw new MapossaError("Il faut au moins une transactions");
        const comptes = await CompteFinancier.getAllOfUser(idUser);

        comptes.forEach(async (compte) => {

            const transactionsduCompte = transactions.filter(el => el.idCompte == compte.id);
            if (transactionsduCompte.length > 0) {
                let sommeEntree = 0;
                let sommeSortie = 0;
                
                
                transactionsduCompte.forEach((t) => {
                    logger.log(t)
                    
                    if (t.flux == "Entrant") {sommeEntree += t.montant}; 
                    if (t.flux == "Sortant") {
                        sommeSortie+= t.montant
                    };


                })
                compte.sommeEntree = sommeEntree;
                compte.sommeSortie = sommeSortie;
                await compte.updateSolde(idUser)
            }


        })
        await Transaction.bulkCreate(idUser, transactions)
    }
}
