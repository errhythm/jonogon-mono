import {router} from '../index.mjs';
import {
    approve,
    formalize,
    reject,
} from '../procedures/petitions/moderation.mjs';
import {clearVote, vote} from '../procedures/petitions/voting.mjs';
import {
    createPetition,
    getPetition,
    remove,
    removeAttachment,
    submitPetition,
    updatePetition,
    softDeletePetition,
} from '../procedures/petitions/crud.mjs';
import {
    listPetitions,
    listSuggestedPetitions,
    searchPetitions
} from '../procedures/petitions/listing/list-petitions.mjs';
import {listPendingPetitionRequests} from '../procedures/petitions/listing/pending-petition-requests.mjs';

export const petitionRouter = router({
    // CRUD
    list: listPetitions,
    listPendingPetitionRequests: listPendingPetitionRequests,
    listSuggestedPetitions: listSuggestedPetitions,

    get: getPetition,
    create: createPetition,

    search: searchPetitions,

    update: updatePetition,
    submit: submitPetition,
    removeAttachment: removeAttachment,

    softDeletePetition: softDeletePetition,
    remove: remove,

    // Skibidi
    vote: vote,
    clearVote: clearVote,

    // Admin / Mod
    approve: approve,
    reject: reject,
    formalize: formalize,
});
