import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { ModalTemplate, SuiActiveModal, SuiModalService, TemplateModalConfig } from '@richardlt/ng2-semantic-ui';
import { Operation } from 'app/model/operation.model';
import { Pipeline } from 'app/model/pipeline.model';
import { Project } from 'app/model/project.model';
import { PipelineService } from 'app/service/pipeline/pipeline.service';
import { ApplicationWorkflowService } from 'app/service/services.module';
import { WorkflowService } from 'app/service/workflow/workflow.service';
import { AutoUnsubscribe } from 'app/shared/decorator/autoUnsubscribe';
import { ToastService } from 'app/shared/toast/ToastService';
import { CDSWebWorker } from 'app/shared/worker/web.worker';
import { AuthenticationState } from 'app/store/authentication.state';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-update-ascode',
    templateUrl: './update-ascode.html',
    styleUrls: ['./update-ascode.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
@AutoUnsubscribe()
export class UpdateAsCodeComponent {

    @Input() project: Project;
    @Input() appName: string;
    @Input() name: string;
    dataToSave: any;
    dataType: string;

    @ViewChild('updateAsCodeModal', { static: false })
    public myModalTemplate: ModalTemplate<boolean, boolean, void>;
    modal: SuiActiveModal<boolean, boolean, void>;
    modalConfig: TemplateModalConfig<boolean, boolean, void>;

    branches: Array<string>;
    selectedBranch: string;
    commitMessage: string;
    loading: boolean;
    webworkerSub: Subscription;
    ope: Operation;

    constructor(private _modalService: SuiModalService, private _awService: ApplicationWorkflowService,
                private _cd: ChangeDetectorRef, private _toast: ToastService, private _translate: TranslateService,
                private _workflowService: WorkflowService, private _store: Store, private _pipService: PipelineService) {
    }

    show(data: any, type: string) {
        this.loading = false;
        this.dataToSave = data;
        this.dataType = type;
        this.modalConfig = new TemplateModalConfig<boolean, boolean, void>(this.myModalTemplate);
        this.modal = this._modalService.open(this.modalConfig);
        this._awService.getVCSInfos(this.project.key, this.appName, '').pipe(first())
            .subscribe(vcsinfos => {
                if (vcsinfos && vcsinfos.branches) {
                    this.branches = vcsinfos.branches.map(b => b.display_id);
                }
                this._cd.markForCheck();
            });
    }

    optionsFilter = (opts: Array<string>, query: string): Array<string> => {
        this.selectedBranch = query;
        let result = Array<string>();
        opts.forEach(o => {
            if (o.indexOf(query) > -1) {
                result.push(o);
            }
        });
        if (result.indexOf(query) === -1) {
            result.push(query);
        }
        return result;
    };

    save(): void {
        this.loading = true;
        switch (this.dataType) {
            case 'workflow':
                this._workflowService.updateAsCode(
                    this.project.key, this.name,
                    this.selectedBranch, this.commitMessage,
                    this.dataToSave).pipe(first()).subscribe(ope => {
                    this.ope = ope;
                    let zone = new NgZone({ enableLongStackTrace: false });
                    let webworker = new CDSWebWorker('./assets/worker/web/operation.js');
                    webworker.start({
                        'user': this._store.selectSnapshot(AuthenticationState.user),
                        'api': '/cdsapi',
                        'path': '/project/' + this.project.key + '/workflows/' + this.name + '/ascode/' + this.ope.uuid
                    });
                    this.webworkerSub = webworker.response().subscribe(operation => {
                        if (operation) {
                            zone.run(() => {
                                this.ope = JSON.parse(operation);
                                if (this.ope.status > 1) {
                                    this.loading = false;
                                    webworker.stop();
                                }
                                this._cd.markForCheck();
                            });
                        }
                    });
                });
                break;
            case 'pipeline':
                this._pipService
                    .updateAsCode(this.project.key, <Pipeline>this.dataToSave, this.selectedBranch, this.commitMessage)
                    .subscribe(ope => {
                    this.ope = ope;
                    let zone = new NgZone({ enableLongStackTrace: false });
                    let webworker = new CDSWebWorker('./assets/worker/web/operation.js');
                    webworker.start({
                        'user': this._store.selectSnapshot(AuthenticationState.user),
                        'api': '/cdsapi',
                        'path': '/project/' + this.project.key + '/workflows/' + this.name + '/ascode/' + this.ope.uuid
                    });
                    this.webworkerSub = webworker.response().subscribe(operation => {
                        if (operation) {
                            zone.run(() => {
                                this.ope = JSON.parse(operation);
                                if (this.ope.status > 1) {
                                    this.loading = false;
                                    webworker.stop();
                                }
                                this._cd.markForCheck();
                            });
                        }
                    });
                });
                break;
            default:
                this._toast.error('', this._translate.instant('ascode_error_unknown_type'))
        }
    }
}
