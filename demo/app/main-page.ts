import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';

let model: HelloWorldModel;

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    let page = <pages.Page>args.object;
    page.bindingContext = new HelloWorldModel();
    model = page.bindingContext;
}

export function onReconnectTap() {
    model.reconnect();
}

export function onLockTap() {
    if (model.validateConstructor()) {
        model.set("lockMessage", "");
        model.set("paramsVisible", "collapse");
        model.set("connectVisible", "visible");
        model.connect();
    } else {
        model.set("lockMessage", "Invalid Parameters");
    }
}

export function onEditTap() {
    model.set("paramsVisible", "visible");
    model.set("connectVisible", "collapse");
    model.disposeClient();
}

export function onSubscribeTap() {
    model.subscribe();
}

export function onUnsubscribeTap() {
    model.unsubscribe();
}

export function onSendMessageTap() {
    model.sendMessage();
}
