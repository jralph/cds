import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AuthConsumerScopeDetail } from 'app/model/authentication.model';

@Component({
    selector: 'app-scope-detail',
    templateUrl: './scope-detail.html',
    styleUrls: ['./scope-detail.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScopeDetailComponent {
    scopeDetail: AuthConsumerScopeDetail;
    @Input() set scope(value: AuthConsumerScopeDetail) {
        this.scopeDetail = value;
        this.scopeDetail.endpoints.forEach(endpoint => {
            const key = this.scopeDetail.scope + '-' + endpoint.route;
            this.selectedRouteMethods[key] = {};
            endpoint.methods.forEach(method => {
                this.selectedRouteMethods[key][method] = true;
            });
        });
        this._cd.markForCheck();
    }

    advancedOpen: boolean;
    selectedRouteMethods: Map<string, any>;

    constructor(private _cd: ChangeDetectorRef) {
        this.selectedRouteMethods = new Map();
    }

    clickAdvanced() {
        this.advancedOpen = !this.advancedOpen;
        this._cd.markForCheck();
    }
}
