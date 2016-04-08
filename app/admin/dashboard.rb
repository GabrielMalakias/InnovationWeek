ActiveAdmin.register_page "Dashboard" do

  menu priority: 0, label: proc{ I18n.t("active_admin.dashboard") }

  content title: proc{ I18n.t("active_admin.dashboard") } do
    columns do
      column do
        panel "Analistas" do
          #table_for Doodle::User::Analyst.joins(:user_channels).where('doodle_user_channels.status' => 'online') do
          panel "Ativos" do
            table_for [ {login: 'aladdin', protocols_number: 17} ] do
              column :login
              column :protocols_number
            end
          end
          panel "Em Espera" do
            table_for [ {login: 'aladdin'} ] do
              column :login
            end
          end
        end
      end

      column do
        panel 'Protocolos' do
          panel  "Waiting"
          table_for [ {name: 'corporativo', number: 17} ] do
            column :name
            column :number
          end
        end
        panel  "Doing" do
          table_for [ {name: 'corporativo', number: 17} ] do
            column :name
            column :number
          end
        end
      end
    end
  end
end
