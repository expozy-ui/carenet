

export let Speedy = {


    get_speedy: async function (dataCollect) {
        let response = [];

        ;

        let endpoint = Helpers.combineRequest('speedy', dataCollect.combinedData);

        let api = new ApiClass();
        await api.get(endpoint, true);

        return api.response;

    },



}

window.Speedy = Speedy;
